import type { Editor, MarkdownView, TFile } from 'obsidian';
import { Plugin } from 'obsidian';
import { AgentConnectix } from './AgentConnectix';
import { AgentTexteurAPI } from './AgentTexteurAPI';

interface AntidoteSettings {
}

const DEFAULT_SETTINGS: AntidoteSettings = {
}

const AcMap: Map<Editor, AgentConnectix> = new Map();

function DonneAgentConnectixPourDocument(td: Editor, tf: TFile): AgentConnectix {
  if (!AcMap.has(td))
    AcMap.set(td, new AgentConnectix(new AgentTexteurAPI(td, tf)));

  return AcMap.get(td)!;
}

export default class MyPlugin extends Plugin {
  settings: AntidoteSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'antidote-api-correcteur',
      name: 'Correction',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        const AC = DonneAgentConnectixPourDocument(editor, view.file!);
        AC.Initialise().then(() => {
          AC.LanceCorrecteur();
        });
      },
    });

    this.addCommand({
      id: 'antidote-api-dictionnaire',
      name: 'Dictionnaire',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        const AC = DonneAgentConnectixPourDocument(editor, view.file!);
        AC.Initialise().then(() => {
          AC.LanceDictionnaire();
        });
      },
    });

    this.addCommand({
      id: 'antidote-api-guide',
      name: 'Guide',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        const AC = DonneAgentConnectixPourDocument(editor, view.file!);
        AC.Initialise().then(() => {
          AC.LanceGuide();
        });
      },
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
