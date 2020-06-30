import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as ejs from 'ejs';

let userEngine;

const engineEJS = (string: string, inputs: object): Promise<string> => {
	const options = {
		async: true,
	};
	return ejs.render(string, inputs, options) as Promise<string>;
};

const parse = userEngine || engineEJS;

interface FileInfo {
	name: string,
	contents: string,
	isDirectory: boolean,
}

async function *walk(directory: string, relativePath: string= ''): AsyncGenerator | FileInfo {
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
			yield* await walk(filePath, fileInfo.name);
		}
	}
};

const writeOutput = ({name, contents, isDirectory}: FileInfo, outputDirectory: string) => {
	const outputName = path.join(outputDirectory, name);
	if (isDirectory) {
		return fse.ensureDir(outputName);
	}
	fse.outputFile(outputName, contents).
		catch((e: Error) => {
			console.error('Scaffixer Error:', e);
		});
};

const findClosestDirectory = async(filePath: string): Promise<string> => {
	return await fs.promises.stat(filePath).
		then((file) => {
			return file.isDirectory() ? filePath : path.join(filePath, '/../');
		});
};

export const scaffix = async(directory: string, inputs: object, outputPath: string) => {
	const outputDirectory = await findClosestDirectory(outputPath);
	// Just straight copy directory if no templating needed.
	if(!inputs) {
		fse.copy(
			directory,
			outputPath,
		);
	} else {
		for await (const file of walk(directory)) {
			const {name, contents, isDirectory} = file as FileInfo;
			const parsedFileInfo: FileInfo = {
				name: await parse(name, inputs),
				contents: contents && await parse(contents, inputs),
				isDirectory: isDirectory,
			};
			writeOutput(parsedFileInfo, outputDirectory);
		}
	}
};