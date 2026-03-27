import Backbone from "backbone";
import $ from "jquery";
import Cookies from "js-cookie";
import endpoints from "../util/endpoints";
import vent from "../util/vent";
import Ws from "../util/Ws";

const UserModel = Backbone.Model.extend({
  idAttribute: "ID",
  initialize() {
    let city = Cookies.get("city");
    if (city) {
      try {
        city = JSON.parse(city);
      } catch (e) {
        city = null;
      }
    }
    if (city && city.uid) {
      this.set("uid", city.uid);
      this.load(city.uid);
    }
    vent.on("msg_" + this.get("INDICE") + "/" + this.get("ID"), (data) => {
      this.set(data.entry);
      console.log("updated ciudadano", data.room, data.entry);
    });
    this.listenTo(this, "change:uid", () => {
      this.subscribe();
    });
  },
  url() {
    return (
      endpoints.apiUrl +
      "index.cgi?" +
      this.get("INDICE") +
      "/" +
      this.get("ID")
    );
  },
  subscribe() {
    if (this.get("INDICE") && this.get("ID")) {
      Ws.update(this.get("INDICE") + "/" + this.get("ID"));
    }
  },
  load(uid) {
    const self = this;
    $.ajax({
      type: "POST",
      url: endpoints.apiUrl + "login.cgi",
      data: {
        uid,
      },
      success(data) {
        if (data.status !== "ok") {
          console.log("error: ", data.status);
          self.clear();
        } else {
          self.set(data.user);
          self.set("uid", uid);
        }
      },
    });
  },
});
export default new UserModel();
