import * as agTexteur from './InterfaceAgentTexteur';
import { regReader } from './Registry';

function aRecuToutLesPaquets(laListe: Array<string>, leNombrePaquet: number): boolean {
    for(let item of laListe)
    {
         if(item.length == 0) return false;
    }
    return true;
}

export class AgentConnectix {
    private prefs: any;
    private ws: WebSocket;
    private monAgent: agTexteur.AgentTexteur | undefined;
    private estInit: boolean;

    private listePaquetsRecu: Array<string>;

    constructor(agent: agTexteur.AgentTexteur) {
        this.monAgent = agent;
        this.prefs = {} as JSON;
        this.ws = {} as WebSocket;
        this.listePaquetsRecu = new Array(0);
        this.estInit = false;
    }

    async Initialise() {
        if(this.estInit) return true;
        let retour = await this.ObtiensReglages();
        this.estInit = true;
        return retour;
    }

    LanceCorrecteur():void {
        let laRequete = {
        message : "LanceOutil",
        outilApi : "Correcteur",
        }
        this.EnvoieMessage(JSON.stringify(laRequete));
    }

    LanceDictionnaire():void {
        let laRequete = {
        message : "LanceOutil",
        outilApi : "Dictionnaires",
        }
        this.EnvoieMessage(JSON.stringify(laRequete));
    }

    LanceGuide():void {
        let laRequete = {
        message : "LanceOutil",
        outilApi : "Guides",
        }
        this.EnvoieMessage(JSON.stringify(laRequete));
    }

    private GereMessage(data: any){
        console.log(data);
        let laReponse :any = {};
        laReponse.idMessage = data.idMessage;
        if(data.message == "init")
        {
            laReponse.titreDocument = this.monAgent?.DonneTitreDocument();
            laReponse.retourChariot = this.monAgent?.DonneRetourDeCharriot();
            laReponse.permetRetourChariot = this.monAgent?.PermetsRetourDeCharriot();
            laReponse.permetEspaceInsecables = this.monAgent?.JeTraiteLesInsecables();
            laReponse.permetEspaceFin = this.monAgent?.EspaceFineDisponible();
            laReponse.remplaceSansSelection = true;

			console.log({ laReponse });
            this.EnvoieMessage(JSON.stringify(laReponse));
        }
        else if(data.message == "cheminDocument")
        {
            laReponse.donnee = !this.monAgent?.DonneCheminDocument();
            this.EnvoieMessage(JSON.stringify(laReponse));
        }
        else if(data.message == "docEstDisponible")
        {
            laReponse.donnees = this.monAgent?.DocEstDisponible();

            this.EnvoieMessage(JSON.stringify(laReponse));
        }
        else if(data.message == "donneZonesTexte")
        {
            this.monAgent?.DonneLesZonesACorriger().then((lesZones) => {
                let lesZonesEnJSON : agTexteur.ZoneDeTexteJSONAPI[] = new Array();

                lesZones?.forEach(element => {
                    lesZonesEnJSON.push(element.toJsonAPI());
                });
                laReponse.donnees = lesZonesEnJSON;
                this.EnvoieMessage(JSON.stringify(laReponse));
            });
        }
        else if(data.message == "editionPossible")
        {
            let idZone: string = data.donnees.idZone;
            let chaine: string = data.donnees.contexte;
            let debut: number = data.donnees.positionDebut;
            let fin:number = data.donnees.positionFin;

            laReponse.donnees = this.monAgent?.PeutCorriger(idZone,debut,fin, chaine);
            this.EnvoieMessage(JSON.stringify(laReponse));
        }
        else if(data.message == "remplace")
        {
            let idZone: string = data.donnees.idZone;
            let chaine: string = data.donnees.nouvelleChaine;
            let debut: number = data.donnees.positionRemplacementDebut;
            let fin: number = data.donnees.positionRemplacementFin;

            this.monAgent?.CorrigeDansTexteur(idZone, debut, fin, chaine, false).then((reponse) => {
                this.monAgent?.MetsFocusSurLeDocument();
                laReponse.donnees = true;
                this.EnvoieMessage(JSON.stringify(laReponse));
            });
        }
        else if(data.message == "selectionne")
        {
            let idZone: string = data.donnees.idZone;
            let debut: number = data.donnees.positionDebut;
            let fin: number = data.donnees.positionFin;

            this.monAgent?.SelectionneIntervalle(idZone, debut, fin);
        }
        else if(data.message == "retourneAuDocument")
        {
            this.monAgent?.RetourneAuTexteur();
        }
    }

    private async DonnePathAgentConsole() {
        if(process.platform === "darwin")
        {
            const plist = require('bplist-parser');
            const homedir = require('os').homedir();
            let data;
            let xml = await plist.parseFile(homedir + "/Library/Preferences/com.druide.Connectix.plist");
            data = xml[0].DossierApplication;
            return data + "/Contents/SharedSupport/AgentConnectixConsole";
        }
        else if(process.platform === "linux")
            return "/usr/local/bin/AgentConnectixConsole";
        else if(process.platform === "win32")
        {
            let retour = regReader("HKEY_LOCAL_MACHINE\\SOFTWARE\\Druide informatique inc.\\Connectix", "DossierConnectix");
            return retour + "AgentConnectixConsole.exe";
        }
    }

    private async InitWS() {
        let lePortWS = this.prefs.port;
        this.ws = new WebSocket("ws://localhost:" + lePortWS);
        let moiMeme = this;
        this.ws.addEventListener('message', (event)=> {
			console.log({event});
			moiMeme.RecoisMessage(event.data); });
        this.ws.addEventListener('close', () => { moiMeme.estInit = false; });
        this.ws.addEventListener('error', (data) => { moiMeme.estInit = false; });
        let Promesse = new Promise<boolean>(resolve => {
            this.ws.addEventListener('open', () => { resolve(true);});
        });
        let retour = await Promesse;
        return retour;
    }

    private Digere(data : any) {
        if(Object.hasOwnProperty.call(data, "idPaquet"))
        {
            let lesDonnees: string = data.donnees;
            let leNombrePaquet: number = data.totalPaquet;
            let leNumeroPaquet: number = data.idPaquet;

            if(this.listePaquetsRecu.length < leNombrePaquet)
                this.listePaquetsRecu =  new Array(leNombrePaquet);

            this.listePaquetsRecu[leNumeroPaquet-1] = lesDonnees;
            
            if(aRecuToutLesPaquets(this.listePaquetsRecu, leNombrePaquet))
            {
                let leMessageStr: string = this.listePaquetsRecu.join('');
                this.listePaquetsRecu = new Array(0);
                this.GereMessage(JSON.parse(leMessageStr));
            }
        }
    }

    private RecoisMessage(data : any) {
		console.log({data })
        let leMsg = JSON.parse(data);
        this.Digere(leMsg);
    }

    private EnvoiePaquet(paquet: string) {
        if(this.ws.readyState == this.ws.OPEN) {
            this.ws.send(paquet);
        }
    }

    private EnvoieMessage(msg : string) {
        let laRequete = {
            idPaquet : 0,
            totalPaquet : 1,
            donnees : msg
            };
        
        this.EnvoiePaquet(JSON.stringify(laRequete));
    }

    private async ObtiensReglages() {
        let path = await this.DonnePathAgentConsole();
        let AgentConsole = require('child_process').spawn(path, ["--api"]);
        
        let Promesse = new Promise<boolean>(resolve => {

        AgentConsole.stdout.on('data', (data:any) => {
            let str: String = data.toString('utf8');
            this.prefs = JSON.parse(str.substring(str.indexOf('{'), str.length));
            this.InitWS().then(retour=> {resolve(retour);});
        })});
        AgentConsole.stdin.write('API')
        let retour = await Promesse;
        return retour;
    }
}
