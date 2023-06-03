import * as AgTxt from "./InterfaceAgentTexteur";
import * as obsidian from 'obsidian'

export class AgentTexteurAPI extends AgTxt.AgentTexteur {

    private monDocument : obsidian.Editor;
	private file: obsidian.TFile;

    constructor(doc: obsidian.Editor, file: obsidian.TFile) {
        super();
        console.log(file);
        this.monDocument = doc;
		this.file = file;
    }

   private PositionAbsolue(pos: obsidian.EditorPosition):number {
        return this.monDocument.posToOffset(pos);
    }

    private PositionVS(pos: number): obsidian.EditorPosition {
        return this.monDocument.offsetToPos(pos);
    }

    CorrigeDansTexteur(leIDZone: string, leDebut: number, laFin: number, laChaine: string, automatique: boolean): Promise<boolean> {
        let posDebut: obsidian.EditorPosition   = this.PositionVS(leDebut);
        let posFin: obsidian.EditorPosition    = this.PositionVS(laFin);
		this.monDocument.replaceRange(laChaine, posDebut, posFin);
		return new Promise((resolve) => resolve(true));
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
        return this.file.basename + '.' + this.file.extension;
    }
    PermetsRetourDeCharriot(): boolean { return true; }

    PeutCorriger(leIDZone: string, debut: number, fin: number, laChaineOrig: string): boolean {
        if(!this.DocEstDisponible()) return false;
        
        let posDebut: obsidian.EditorPosition = this.PositionVS(debut);
        let posFin: obsidian.EditorPosition = this.PositionVS(fin);

        let contexteMatchParfaitement = this.monDocument.getRange(posDebut, posFin) == laChaineOrig;
        let contexteMatchAuDebut = true;
        if(!contexteMatchParfaitement)
        {
            posFin = this.PositionVS(fin+1);
            contexteMatchAuDebut = this.monDocument.getRange(posDebut, posFin).startsWith(laChaineOrig);
        }

         return contexteMatchParfaitement || contexteMatchAuDebut;
    }
    
    SelectionneIntervalle(leIDZone: string, debut: number, fin: number): void {
		let posDebut: obsidian.EditorPosition = this.PositionVS(debut);
		let posFin: obsidian.EditorPosition = this.PositionVS(fin);

		this.monDocument.setSelection(posDebut, posFin);
		this.monDocument.focus()
    }

    DonneLesZonesACorriger(): Promise<AgTxt.ZoneDeTexte[]> {
        return new Promise<AgTxt.ZoneDeTexte[]>((resolve) => {
            let lesZones: AgTxt.ZoneDeTexte[] = new Array;
			let leTexte: string = this.monDocument.getValue();
			let selDebut: number = this.PositionAbsolue(this.monDocument.getCursor('from'));
			let selFin: number = this.PositionAbsolue(this.monDocument.getCursor('to'));
			let uneZone: AgTxt.ZoneDeTexte = new AgTxt.ZoneDeTexte(leTexte, selDebut,selFin, "0");
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
