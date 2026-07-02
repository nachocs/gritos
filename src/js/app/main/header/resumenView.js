import Backbone from "backbone";
import _ from "lodash";
import HeadModel from "../../models/headModel";
import UserModel from "../../models/userModel";
import vent from "../../util/vent";
import ViewBase from "../base/ViewBase";
import ResumenItemView from "./resumenItemView";
import template from "./resumenView-t.html";

const Model = Backbone.Model.extend({});

export default ViewBase.extend({
  model: new Model(),
  className: "mdl-navigation resumen-collection",
  tagName: "nav",
  template: _.template(template),
  initialize() {
    this.views = {};
    this.listenTo(this.collection, "reset", this.render.bind(this));
    this.listenTo(this.collection, "sync", this.render.bind(this));
    this.listenTo(this.collection, "add", this.renderOne.bind(this));
    this.listenTo(this.collection, "remove", this.removeOne.bind(this));
    this.listenTo(UserModel, "change:ID", this.render.bind(this));
  },
  events: {
    "submit #nuevotema": "searchNuevoTema",
  },
  searchNuevoTema(e) {
    e.preventDefault();
    e.stopPropagation();
    let nuevoTema = this.$("#nuevo-tema").val();
    const newHead = new HeadModel();
    const self = this;
    if (!nuevoTema) {
      return;
    }
    nuevoTema = nuevoTema.replace(/\s/gi, "_").replace(/\W/gi, "");
    newHead.set("Name", nuevoTema);
    newHead.fetch({
      success(model) {
        if (model.get("ID")) {
          self.showNuevoTemaError(nuevoTema);
        } else {
          self.openNuevoTemaModal(newHead);
        }
      },
      error(data) {
        console.log("error", data);
        self.showNuevoTemaError(nuevoTema);
      },
    });
    console.log(nuevoTema);
  },
  showNuevoTemaError() {
    this.$(".mdl-textfield__error").css({ visibility: "visible" }).show();
  },
  openNuevoTemaModal(model) {
    model.set({
      Userid: UserModel.ID,
      INDICE: "gritosdb",
    });
    vent.trigger("modal:update", {
      model: {
        show: true,
        header: "NUEVO TEMA/FORO",
      },
      editForm: {
        userModel: UserModel,
        msg: model,
        isHead: true,
      },
    });
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    this.collection.each((model) => {
      this.renderOne(model);
    }, this);
    this.materialDesignUpdate();
    this.delegateEvents();
    return this;
  },
  renderOne(model) {
    const msgView = new ResumenItemView({
      model,
      attributes: () => {
        return {
          "data-link":
            "/" +
            model
              .get("name")
              .replace(/gritos\//, "")
              .replace(/foros\//, ""),
        };
      },
    });
    this.views[model.id] = msgView;
    this.$(".resumen-collection-view").append(msgView.render().el);
  },
  removeOne(model) {
    if (this.views[model.id]) {
      this.views[model.id].trigger("remove");
      delete this.views[model.id];
    }
  },
  serializer() {
    return Object.assign(this.model.toJSON(), {
      userModel: UserModel.toJSON(),
    });
  },
});
