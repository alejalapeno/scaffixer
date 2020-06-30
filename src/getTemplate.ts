import {QuickPickItem, window} from 'vscode';

interface TemplatesSettings {
	name: string,
	location: string,
	description?: string,
	prompts?: Array<string>,
}

export class TemplateItem implements QuickPickItem {
	public label: string;
	public location: string;
	public prompts?: Array<string>;
	public detail?: string;
	constructor({name = '', location, description, prompts}: TemplatesSettings) {
		this.label = name;
		this.location = location;
		this.prompts = prompts;
		this.detail = description;
	}
}

export const getTemplate = (templates: Array<TemplatesSettings> | undefined) => {
	if(templates) {
		return new Promise<TemplateItem | undefined>((resolve) => {
			const input = window.createQuickPick<TemplateItem>();
			input.placeholder = 'Pick a template';
			input.items = templates.map((template) => {
				return new TemplateItem(template);
			});
			input.onDidChangeSelection((items) => {
				const item = items[0];
				input.dispose();
				if(!item.location) {
					window.showErrorMessage(`Template '${item.label}' doesn't have a 'location' filepath set for its source.`);
					resolve(undefined);
				}
				resolve(item);
			});
			input.show();
		});
	}
	window.showErrorMessage(`There are no 'templates' set in Scaffixer's settings.json.`);
	return undefined;
};