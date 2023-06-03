import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as obsidian from "obsidian";
import { AgentConnectix } from './AgentConnectix';
import { AgentTexteurAPI } from './AgentTexteurAPI';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

var AcMap : Map<obsidian.Editor, AgentConnectix> = new Map;

function DonneAgentConnectixPourDocument(td: obsidian.Editor, tf: obsidian.TFile): AgentConnectix
{
	if(!AcMap.has(td))
		AcMap.set(td, new AgentConnectix(new AgentTexteurAPI(td, tf)));

	return AcMap.get(td)!;
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'antidote-api-correcteur',
			name: 'Correction',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let AC = DonneAgentConnectixPourDocument(editor, view.file!);
				AC.Initialise().then((retour) => {
					AC.LanceCorrecteur();
				} );
			}
		});

		this.addCommand({
			id: 'antidote-api-dictionnaire',
			name: 'Dictionnaire',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let AC = DonneAgentConnectixPourDocument(editor, view.file!);
				AC.Initialise().then((retour) => {
					AC.LanceDictionnaire();
				} );
			}
		});

		this.addCommand({
			id: 'antidote-api-guide',
			name: 'Guide',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let AC = DonneAgentConnectixPourDocument(editor, view.file!);
				AC.Initialise().then((retour) => {
					AC.LanceGuide();
				} );
			}
		});

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
