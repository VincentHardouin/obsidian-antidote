import type * as obsidian from 'obsidian'
import * as AgTxt from './InterfaceAgentTexteur';

export class AgentTexteurAPI extends AgTxt.AgentTexteur {
  private monDocument: obsidian.Editor;
  private file: obsidian.TFile;

  constructor(doc: obsidian.Editor, file: obsidian.TFile) {
    super();
    this.monDocument = doc;
    this.file = file;
  }

  private PositionAbsolue(pos: obsidian.EditorPosition): number {
    return this.monDocument.posToOffset(pos);
  }

  private PositionVS(pos: number): obsidian.EditorPosition {
    return this.monDocument.offsetToPos(pos);
  }

  CorrigeDansTexteur(leIDZone: string, leDebut: number, laFin: number, laChaine: string, automatique: boolean): Promise<boolean> {
    const posDebut: obsidian.EditorPosition = this.PositionVS(leDebut);
    const posFin: obsidian.EditorPosition = this.PositionVS(laFin);
    this.monDocument.replaceRange(laChaine, posDebut, posFin);
    return new Promise(resolve => resolve(true));
  }

  DocEstDisponible(): boolean {
    return true;
  }

  DonneRetourDeCharriot(): string {
    return '\r\n';
  }

  DonneTitreDocument(): string {
    return this.file.basename;
  }

  DonneCheminDocument(): string {
    return `${this.file.basename}.${this.file.extension}`;
  }

  PermetsRetourDeCharriot(): boolean { return true; }

  PeutCorriger(leIDZone: string, debut: number, fin: number, laChaineOrig: string): boolean {
    if (!this.DocEstDisponible())
      return false;

    const posDebut: obsidian.EditorPosition = this.PositionVS(debut);
    let posFin: obsidian.EditorPosition = this.PositionVS(fin);

    const contexteMatchParfaitement = this.monDocument.getRange(posDebut, posFin) === laChaineOrig;
    let contexteMatchAuDebut = true;
    if (!contexteMatchParfaitement) {
      posFin = this.PositionVS(fin + 1);
      contexteMatchAuDebut = this.monDocument.getRange(posDebut, posFin).startsWith(laChaineOrig);
    }

    return contexteMatchParfaitement || contexteMatchAuDebut;
  }

  SelectionneIntervalle(leIDZone: string, debut: number, fin: number): void {
    const posDebut: obsidian.EditorPosition = this.PositionVS(debut);
    const posFin: obsidian.EditorPosition = this.PositionVS(fin);

    this.monDocument.setSelection(posDebut, posFin);
    this.monDocument.focus()
  }

  DonneLesZonesACorriger(): Promise<AgTxt.ZoneDeTexte[]> {
    return new Promise<AgTxt.ZoneDeTexte[]>((resolve) => {
      const lesZones: AgTxt.ZoneDeTexte[] = [];
      const leTexte: string = this.monDocument.getValue();
      const selDebut: number = this.PositionAbsolue(this.monDocument.getCursor('from'));
      const selFin: number = this.PositionAbsolue(this.monDocument.getCursor('to'));
      const uneZone: AgTxt.ZoneDeTexte = new AgTxt.ZoneDeTexte(leTexte, selDebut, selFin, '0');
      lesZones.push(uneZone);
      resolve(lesZones);
    });
  }

  RetourneAuTexteur(): void {
    this.MetsFocusSurLeDocument();
  }

  MetsFocusSurLeDocument() {
    this.monDocument.focus()
  }
}
