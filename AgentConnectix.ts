import type * as agTexteur from './InterfaceAgentTexteur';
import { regReader } from './Registry';

function aRecuToutLesPaquets(laListe: Array<string>, leNombrePaquet: number): boolean {
  for (const item of laListe) {
    if (item.length === 0)
      return false;
  }
  return true;
}

export class AgentConnectix {
  private prefs: JSON;
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
    if (this.estInit)
      return true;
    const retour = await this.ObtiensReglages();
    this.estInit = true;
    return retour;
  }

  LanceCorrecteur(): void {
    const laRequete = {
      message: 'LanceOutil',
      outilApi: 'Correcteur',
    }
    this.EnvoieMessage(JSON.stringify(laRequete));
  }

  LanceDictionnaire(): void {
    const laRequete = {
      message: 'LanceOutil',
      outilApi: 'Dictionnaires',
    }
    this.EnvoieMessage(JSON.stringify(laRequete));
  }

  LanceGuide(): void {
    const laRequete = {
      message: 'LanceOutil',
      outilApi: 'Guides',
    }
    this.EnvoieMessage(JSON.stringify(laRequete));
  }

  private GereMessage(data: any) {
    const laReponse: any = {};
    laReponse.idMessage = data.idMessage;

    switch (data.message) {
      case 'init':
        this.initialisation(laReponse);
        break;
      case 'cheminDocument':
        laReponse.donnee = !this.monAgent?.DonneCheminDocument();
        break;
      case 'docEstDisponible':
        laReponse.donnees = this.monAgent?.DocEstDisponible();
        break;
      case 'donneZonesTexte':
        this.monAgent?.DonneLesZonesACorriger().then((lesZones) => {
          const lesZonesEnJSON: agTexteur.ZoneDeTexteJSONAPI[] = [];

          lesZones?.forEach((element) => {
            lesZonesEnJSON.push(element.toJsonAPI());
          });
          laReponse.donnees = lesZonesEnJSON;
        });
        break;
      case 'editionPossible':
        this.peutCorriger(laReponse, data.donnees);
        break;
      case 'remplace':
        this.peutRemplacer(laReponse, data.donnees);
        break;
      case 'selectionne':
        this.selectionne(laReponse, data.donnees);
        return;
      case 'retourneAuDocument':
        this.monAgent?.RetourneAuTexteur();
        return;
    }

    this.EnvoieMessage(JSON.stringify(laReponse));
  }

  private cheminDocument(laReponse: any) {
    laReponse.donnee = !this.monAgent?.DonneCheminDocument();
  }

  private initialisation(laReponse: any) {
    laReponse.titreDocument = this.monAgent?.DonneTitreDocument();
    laReponse.retourChariot = this.monAgent?.DonneRetourDeCharriot();
    laReponse.permetRetourChariot = this.monAgent?.PermetsRetourDeCharriot();
    laReponse.permetEspaceInsecables = this.monAgent?.JeTraiteLesInsecables();
    laReponse.permetEspaceFin = this.monAgent?.EspaceFineDisponible();
    laReponse.remplaceSansSelection = true;
  }

  private peutCorriger(laReponse: any, data: any) {
    const idZone: string = data.donnees.idZone;
    const chaine: string = data.donnees.contexte;
    const debut: number = data.donnees.positionDebut;
    const fin: number = data.donnees.positionFin;

    laReponse.donnees = this.monAgent?.PeutCorriger(idZone, debut, fin, chaine);
  }

  private peutRemplacer(laReponse: any, data: any) {
    const idZone: string = data.donnees.idZone;
    const chaine: string = data.donnees.nouvelleChaine;
    const debut: number = data.donnees.positionRemplacementDebut;
    const fin: number = data.donnees.positionRemplacementFin;

    this.monAgent?.CorrigeDansTexteur(idZone, debut, fin, chaine, false).then(() => {
      this.monAgent?.MetsFocusSurLeDocument();
      laReponse.donnees = true;
    });
  }

  private selectionne(laReponse: any, data: any) {
    const idZone: string = data.donnees.idZone;
    const debut: number = data.donnees.positionDebut;
    const fin: number = data.donnees.positionFin;

    this.monAgent?.SelectionneIntervalle(idZone, debut, fin);
  }

  private async DonnePathAgentConsole() {
    if (process.platform === 'darwin') {
      const plist = require('bplist-parser');
      const homedir = require('node:os').homedir();
      const xml = await plist.parseFile(`${homedir}/Library/Preferences/com.druide.Connectix.plist`);
      const data = xml[0].DossierApplication;
      return `${data}/Contents/SharedSupport/AgentConnectixConsole`;
    }
    else if (process.platform === 'linux') {
      return '/usr/local/bin/AgentConnectixConsole';
    }
    else if (process.platform === 'win32') {
      const retour = regReader('HKEY_LOCAL_MACHINE\\SOFTWARE\\Druide informatique inc.\\Connectix', 'DossierConnectix');
      return `${retour}AgentConnectixConsole.exe`;
    }
  }

  private async InitWS() {
    const lePortWS = this.prefs.port;
    const ws = new WebSocket(`ws://localhost:${lePortWS}`);
    ws.addEventListener('message', (event) => {
      this.RecoisMessage(event.data);
    });
    ws.addEventListener('close', () => {
      this.estInit = false;
    });
    ws.addEventListener('error', () => {
      this.estInit = false;
    });
    const Promesse = new Promise<boolean>((resolve) => {
      ws.addEventListener('open', () => {
        resolve(true);
      });
    });
    return await Promesse;
  }

  private Digere(data: any) {
    if (Object.hasOwnProperty.call(data, 'idPaquet')) {
      const lesDonnees: string = data.donnees;
      const leNombrePaquet: number = data.totalPaquet;
      const leNumeroPaquet: number = data.idPaquet;

      if (this.listePaquetsRecu.length < leNombrePaquet)
        this.listePaquetsRecu = new Array(leNombrePaquet);

      this.listePaquetsRecu[leNumeroPaquet - 1] = lesDonnees;

      if (aRecuToutLesPaquets(this.listePaquetsRecu, leNombrePaquet)) {
        const leMessageStr: string = this.listePaquetsRecu.join('');
        this.listePaquetsRecu = new Array(0);
        this.GereMessage(JSON.parse(leMessageStr));
      }
    }
  }

  private RecoisMessage(data: any) {
    const leMsg = JSON.parse(data);
    this.Digere(leMsg);
  }

  private EnvoiePaquet(paquet: string) {
    if (this.ws.readyState === this.ws.OPEN)
      this.ws.send(paquet);
  }

  private EnvoieMessage(msg: string) {
    const laRequete = {
      idPaquet: 0,
      totalPaquet: 1,
      donnees: msg,
    };

    this.EnvoiePaquet(JSON.stringify(laRequete));
  }

  private async ObtiensReglages() {
    const path = await this.DonnePathAgentConsole();
    const AgentConsole = require('node:child_process').spawn(path, ['--api']);

    const Promesse = new Promise<boolean>((resolve) => {
      AgentConsole.stdout.on('data', (data: any) => {
        const str: string = data.toString('utf8');
        this.prefs = JSON.parse(str.substring(str.indexOf('{'), str.length));
        this.InitWS().then((retour) => {
          resolve(retour);
        });
      })
    });
    AgentConsole.stdin.write('API')
    const retour = await Promesse;
    return retour;
  }
}
