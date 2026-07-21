import endpoints from "../../util/endpoints";
import { decodeBody } from "./apiFetch";

const NOTIFIABLE_TYPES = ["foro", "minis", "msg", "yo"];

const withGritosPrefix = (room) => {
  if (/^gritos/.test(room) || /^ciudadanos/.test(room)) {
    return room;
  }
  return `gritos/${room}`;
};

/**
 * Port of legacy NotificacionesUserModel: tracks per-room "last seen"
 * watermarks so the notifications feed doesn't keep re-showing entries the
 * user already looked at. Persisted server-side at
 * `index.cgi?notificaciones/<userId>` (same store the socket server reads
 * from on `prepararNotificaciones` to decide what to push on login).
 */
class NotificacionesReadState {
  constructor() {
    this.userId = null;
    this.state = {};
    this.loadingFinished = false;
    this.updateQueue = [];
  }

  async load(userId) {
    this.userId = userId;
    this.state = {};
    this.loadingFinished = false;
    this.updateQueue = [];
    if (!userId) {
      return;
    }
    try {
      const response = await fetch(
        `${endpoints.apiUrl}index.cgi?notificaciones/${userId}`,
      );
      if (response.ok) {
        this.state = JSON.parse(await decodeBody(response)) || {};
      }
    } catch {
      // best-effort, matches legacy's fire-and-forget fetch()
    } finally {
      if (this.userId === userId) {
        this.loadingFinished = true;
        this.runQueue();
      }
    }
  }

  clear() {
    this.userId = null;
    this.state = {};
    this.loadingFinished = false;
    this.updateQueue = [];
  }

  async save() {
    if (!this.userId) {
      return;
    }
    const payload = { ...this.state, ID: this.userId };
    try {
      await fetch(
        `${endpoints.apiUrl}index.cgi?notificaciones/${this.userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
    } catch {
      // best-effort, matches legacy's fire-and-forget save()
    }
  }

  // Called right after the user posts, so their own new entry doesn't
  // immediately show back up as an unread notification.
  addNotificaciones(notis) {
    if (!this.userId) {
      return;
    }
    notis.forEach((nots) => {
      const room = withGritosPrefix(nots.room);
      if (this.state[nots.tipo]) {
        const array = this.state[nots.tipo].split("|");
        let newarray = [];
        let listo = false;
        array.forEach((ele) => {
          const [esteforo, estenum] = ele.split(",");
          if (esteforo === room) {
            newarray.push(`${esteforo},${nots.last}`);
            listo = true;
          } else {
            newarray.push(`${esteforo},${estenum}`);
          }
        });
        if (!listo) {
          newarray.push(`${room},${nots.last}`);
        }
        if (newarray.length > 10) {
          newarray = newarray.slice(-10);
        }
        this.state[nots.tipo] = newarray.join("|");
      } else {
        this.state[nots.tipo] = `${room},${nots.last}`;
      }
    });
    this.save();
  }

  // Called when the user reads a notification, views a subscribed room live,
  // or pages through a message list — advances the watermark for that room.
  update(tipo, foro, lastEntry, subtipo) {
    if (this.runUpdate(tipo, foro, lastEntry, subtipo)) {
      this.save();
    }
  }

  runUpdate(tipo, foro, lastEntry, subtipo) {
    if (!NOTIFIABLE_TYPES.includes(tipo) || !this.userId) {
      return false;
    }
    const room = withGritosPrefix(foro);
    if (!this.loadingFinished) {
      this.updateQueue.push({ tipo, foro: room, lastEntry, subtipo });
      return false;
    }
    let changed = false;
    if (this.state[tipo]) {
      const array = this.state[tipo].split("|");
      const newarray = [];
      array.forEach((ele) => {
        const [esteforo, estenum] = ele.split(",");
        if (tipo === "msg") {
          const molaArray = (estenum || "").split("/");
          const molanumPos =
            subtipo === "mola" ? 0 : subtipo === "nomola" ? 1 : subtipo === "love" ? 2 : -1;
          if (
            esteforo === room &&
            molanumPos > -1 &&
            (!molaArray[molanumPos] || molaArray[molanumPos] < lastEntry)
          ) {
            molaArray[molanumPos] = lastEntry;
            newarray.push(`${esteforo},${molaArray.join("/")}`);
            changed = true;
          } else {
            newarray.push(`${esteforo},${estenum}`);
          }
        } else if (tipo === "yo") {
          if (ele < lastEntry) {
            newarray.push(lastEntry);
            changed = true;
          } else {
            newarray.push(estenum);
          }
        } else if (esteforo === room && estenum < lastEntry) {
          newarray.push(`${esteforo},${lastEntry}`);
          changed = true;
        } else {
          newarray.push(`${esteforo},${estenum}`);
        }
      });
      this.state[tipo] = newarray.join("|");
    }
    return changed;
  }

  runQueue() {
    let changed = false;
    this.updateQueue.forEach((queued) => {
      if (this.runUpdate(queued.tipo, queued.foro, queued.lastEntry, queued.subtipo)) {
        changed = true;
      }
    });
    this.updateQueue = [];
    if (changed) {
      this.save();
    }
  }
}

const notificacionesReadState = new NotificacionesReadState();
export default notificacionesReadState;
