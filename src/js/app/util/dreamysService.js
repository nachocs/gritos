import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import endpoints from './endpoints';
import 'rxjs/add/observable/dom/ajax';
import 'rxjs/add/operator/map';

const Service = class DreamysService {
  constructor() {
    this.generalDreamysSubject = new ReplaySubject();
    this.gDreamys = this.generalDreamysSubject.asObservable();
    this.generalDreamysLoaded = false;
    this.personalDreamysSubject = new ReplaySubject();
    this.pDreamys = this.personalDreamysSubject.asObservable();
    this.personalDreamysLoaded = {};
  }
  fetchGeneralDreamys() {
    if (this.generalDreamysLoaded) {
      return;
    }
    const url = 'json.cgi?indice=dreamys&encontrar=public';

    return Observable
      .ajax(endpoints.apiUrl + url)
      .map(e => this.mapDreamys(e.response))
      .subscribe((re) => {
        this.generalDreamysLoaded = true;
        this.generalDreamysSubject.next(re);
      });
  }
  getGeneralDreamys() {
    return this.gDreamys;
  }
  mapDreamys(l){
    if (l.IMAGEN1_URL) {
      l.IMAGEN1_URL = l.IMAGEN1_URL.replace(/^https?\:\/\/dreamers\.com/, '');
      l.IMAGEN1_URL = l.IMAGEN1_URL.replace(/^\/\/dreamers\.com\/mrdreamy\//, '/mrdreamy/');
    }
    if (l.IMAGEN1_THUMB) {
      l.IMAGEN1_THUMB = l.IMAGEN1_THUMB.replace(/^https?\:\/\/dreamers\.com/, '');
      l.IMAGEN1_THUMB = l.IMAGEN1_THUMB.replace(/^\/\/dreamers\.com\/mrdreamy\//, '/mrdreamy/');
    }
    return l;
  }
  fetchPersonalDreamys(id) {
    if (this.personalDreamysLoaded[id]) {
      return;
    }
    const url = 'json.cgi?indice=dreamys&encontrar=ciudadano=' + id;

    return Observable
      .ajax(endpoints.apiUrl + url)
      .map(e => this.mapDreamys(e.response))
      .subscribe((re) => {
        this.personalDreamysLoaded[id] = true;
        this.personalDreamysSubject.next(re);
      });
  }
  getPersonalDreamys() {
    return this.pDreamys;
  }
};

export default new Service();