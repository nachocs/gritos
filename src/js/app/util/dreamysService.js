import { ReplaySubject } from "rxjs";
import { ajax } from "rxjs/ajax";
import { map } from "rxjs/operators";
import endpoints from "./endpoints";

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
    const url = "json.cgi?indice=dreamys&encontrar=public";

    return ajax(endpoints.apiUrl + url)
      .pipe(map((e) => this.mapDreamys(e.response)))
      .subscribe((re) => {
        this.generalDreamysLoaded = true;
        this.generalDreamysSubject.next(re);
      });
  }
  getGeneralDreamys() {
    return this.gDreamys;
  }
  mapDreamys(data) {
    return data.map((l) => {
      if (l.IMAGEN1_URL) {
        l.IMAGEN1_URL = l.IMAGEN1_URL.replace(/^https?\:\/\/dreamers\.com/, "");
        l.IMAGEN1_URL = l.IMAGEN1_URL.replace(
          /^\/\/dreamers\.com\/mrdreamy\//,
          "/imagenes/mrdreamy/",
        );
      }
      if (l.IMAGEN1_THUMB) {
        l.IMAGEN1_THUMB = l.IMAGEN1_THUMB.replace(
          /^https?\:\/\/dreamers\.com/,
          "",
        );
        l.IMAGEN1_THUMB = l.IMAGEN1_THUMB.replace(
          /^\/\/dreamers\.com\/mrdreamy\//,
          "/imagenes/mrdreamy/",
        );
      }
      return l;
    });
  }

  fetchPersonalDreamys(id) {
    if (this.personalDreamysLoaded[id]) {
      return;
    }
    const url = "json.cgi?indice=dreamys&encontrar=ciudadano=" + id;

    return ajax(endpoints.apiUrl + url)
      .pipe(map((e) => this.mapDreamys(e.response)))
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
