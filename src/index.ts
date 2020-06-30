// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import {getTemplate} from './getTemplate';
import {getPrompts} from './getPrompts';
import {scaffix} from './scaffixer';

interface UserSettings {
	templates?: Array<TemplatesSettings>,
}

interface TemplatesSettings {
	name: string,
	location: string,
	description?: string,
	prompts?: Array<string>,
}

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('scaffixer.component', async({path: outputPath}) => {
		const {templates} = vscode.workspace.getConfiguration('scaffixer') as UserSettings;
		const template = await getTemplate(templates);
		const data = await getPrompts(template);

		// Only scaffix if prompts weren't canceled.
		if(data !== undefined) {
			template && scaffix(
					template.location, 
					data, 
					outputPath
				);
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
