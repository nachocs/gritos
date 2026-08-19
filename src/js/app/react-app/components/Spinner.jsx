// El spinner de MDL es puro CSS, pero la animacion vive entera en cuatro capas
// (`mdl-spinner__layer-1..4`) que el elemento NO trae en el marcado: las creaba
// `componentHandler.upgradeElement()` al vuelo. `.mdl-spinner` a secas es solo
// una caja de 28x28 sin nada dentro.
//
// Ese JS venia de https://code.getmdl.io/1.3.0/material.min.js y desde 2026 el
// CDN devuelve 403: Google cerro Material Design Lite. O sea que el spinner se
// estaba pintando vacio, invisible. Como la llamada iba dentro de un
// `if (window.componentHandler)`, no petaba nada y no se notaba.
//
// Se pintan las capas aqui en vez de recuperar el script. MDL esta abandonado
// aguas arriba, y esta app ya reimplementa el resto de sus comportamientos por
// la misma razon (ver MdlTextfield.jsx: el JS de MDL solo escanea el DOM una
// vez en DOMContentLoaded, antes de que React monte, asi que nunca llegaba a
// tocar nada de React). Traerse 62 KB de JS muerto para dibujar doce divs no
// salia a cuenta.
//
// La estructura es la que genera createLayer() en
// node_modules/material-design-lite/src/spinner/spinner.js, copiada al pie de
// la letra: cuatro capas, y dentro de cada una un clipper izquierdo, un
// gap-patch y un clipper derecho, cada uno con su circulo. La clase
// `is-upgraded` la ponia init() al terminar y el CSS la usa, asi que va tambien.
const CAPAS = [1, 2, 3, 4];

const Capa = ({ indice }) => (
  <div className={`mdl-spinner__layer mdl-spinner__layer-${indice}`}>
    <div className="mdl-spinner__circle-clipper mdl-spinner__left">
      <div className="mdl-spinner__circle" />
    </div>
    <div className="mdl-spinner__gap-patch">
      <div className="mdl-spinner__circle" />
    </div>
    <div className="mdl-spinner__circle-clipper mdl-spinner__right">
      <div className="mdl-spinner__circle" />
    </div>
  </div>
);

const Spinner = () => (
  <div className="spinner-main">
    <div className="mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active is-upgraded">
      {CAPAS.map((i) => (
        <Capa key={i} indice={i} />
      ))}
    </div>
  </div>
);

export default Spinner;
