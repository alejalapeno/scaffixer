import {window} from 'vscode';
import {TemplateItem} from './getTemplate';

export const getPrompts = async(template: TemplateItem | undefined): Promise<Object | undefined> => {
	if(template) {
		const showPrompt = async(prompt: string) => {
			return window.showInputBox({
				placeHolder: prompt,
				prompt,
				ignoreFocusOut: true,
				validateInput: (value) => {
					return value ? null : 'Cannot be blank';
				}
			});
		};
		let data = {};
		if(template.prompts) {
			for await (const prompt of template.prompts) {
				const reply = await showPrompt(prompt);
				// Early exit if an input is canceled
				if(reply === undefined) {
					return undefined;
				}
				data = {...data, [prompt]: reply};
			}
		}
		return data;
	}
};