// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from 'path';
import {commands, workspace, ExtensionContext} from 'vscode';
import {getTemplate} from './getTemplate';
import {getPrompts} from './getPrompts';
import {scaffix} from './scaffixer';

interface UserSettings {
	templates?: TemplatesSettings[],
}

interface TemplatesSettings {
	name: string,
	location: string,
	description?: string,
	prompts?: string[],
}

export function activate(context: ExtensionContext) {
	let disposable = commands.registerCommand('scaffixer.context', async({path: outputPath}) => {
		try {
			const {templates} = workspace.getConfiguration('scaffixer') as UserSettings;
			const template = await getTemplate(templates);
			const inputData = await getPrompts(template);

			// Only scaffix if prompts weren't canceled.
			if(inputData !== undefined) {
				template &&
          scaffix(
            path.resolve(workspace.workspaceFolders![0].uri.path, template.location),
            inputData,
            outputPath
          );
			}
		} catch (err) {
			throw new Error(`Scaffixer Error: ${err}`);
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
