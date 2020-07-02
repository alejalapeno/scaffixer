import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import {render} from 'ejs';
import {window} from 'vscode';

interface FileInfo {
	name: string,
	contents: string,
	isDirectory: boolean,
}

async function* readFile(filepath: string): AsyncGenerator<FileInfo, void, undefined> {
	const fileInfo: FileInfo = {
		name: path.basename(filepath),
		contents: await fs.promises.readFile(filepath, {encoding: 'utf8'}),
		isDirectory: false,
	};
	yield fileInfo;
};

async function* walkDirectory(directory: string, relativePath: string = ''): AsyncGenerator<FileInfo, void, undefined> {
	for await (const file of await fs.promises.readdir(directory, {withFileTypes: true})) {
		const {name} = file;
		const filePath = path.join(directory, name);
		const fileInfo: FileInfo = {
			name: path.join(relativePath, name),
			contents: file.isDirectory() ? '' : await fs.promises.readFile(filePath, {encoding: 'utf8'}),
			isDirectory: file.isDirectory(),
		};
		yield fileInfo;
		if (file.isDirectory()) {
			yield* await walkDirectory(filePath, fileInfo.name);
		}
	}
};

const findClosestDirectory = async(filepath: string): Promise<string> => {
	return await fs.promises.stat(filepath).
		then((file) => {
			return file.isDirectory() ? filepath : path.join(filepath, '/../');
		});
};

const getContents = async(filepath: string): Promise<AsyncGenerator<FileInfo, void, undefined>> => {
	const stats = await fs.promises.stat(filepath).
		catch((err) => {
			window.showErrorMessage(`Cannot read or find file/directory at 'location'${filepath}`);
			throw new Error(`Cannot read or find file/directory at 'location'${filepath}`);
		});
	const handler = stats.isFile() ? readFile : walkDirectory;
	return handler(filepath);
};

let userEngine;

const engineEJS = (string: string, inputs: object): Promise<string> => {
	const renderPromise = (string: string, inputs: object): Promise<string> => {
		const options = {
			async: true,
		};
		return render(string, inputs, options) as Promise<string>;
	};
	const options = {
		async: true,
	};
	return renderPromise(string, inputs).
		catch((err) => {
			window.showErrorMessage(`Template contains a variable that is missing from the prompts: ${err}`);
			throw new Error('EJS cannot render.');
		});
};

const parse = userEngine || engineEJS;

const writeOutput = ({name, contents, isDirectory}: FileInfo, outputDirectory: string) => {
	const outputName = path.join(outputDirectory, name);
	if (isDirectory) {
		return fse.ensureDir(outputName);
	}
	fse.outputFile(outputName, contents).
		catch((err: Error) => {
			console.error('Scaffixer Error:', err);
		});
};

export const scaffix = async(filepath: string, inputData: object, outputPath: string) => {
	const outputDirectory = await findClosestDirectory(outputPath);
	// Just straight copy directory if no templating needed.
	if(!inputData) {
		fse.copy(
			filepath,
			outputPath,
		);
	} else {
		for await (const file of await getContents(filepath)) {
			const {name, contents, isDirectory} = file as FileInfo;
			const parsedFileInfo: FileInfo = {
				name: await parse(name, inputData),
				contents: contents && await parse(contents, inputData),
				isDirectory: isDirectory,
			};
			writeOutput(parsedFileInfo, outputDirectory);
		}
	}
};