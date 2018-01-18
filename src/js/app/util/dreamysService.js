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
    if (this.generalDreamysLoaded) { return; }
    const url = 'json.cgi?indice=dreamys&encontrar=public';

    return Observable
      .ajax(endpoints.apiUrl + url)
      .map(e => e.response)
      .subscribe((re) => {
        this.generalDreamysLoaded = true;
        this.generalDreamysSubject.next(re);
      });
  }
  getGeneralDreamys() {
    return this.gDreamys;
  }
  fetchPersonalDreamys(id) {
    if (this.personalDreamysLoaded[id]) { return; }
    const url = 'json.cgi?indice=dreamys&encontrar=ciudadano=' + id;

    return Observable
      .ajax(endpoints.apiUrl + url)
      .map(e => e.response)
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