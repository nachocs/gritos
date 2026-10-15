# Aviso: este repo forma parte del sistema de notificaciones (dreamers.es + gritos.com)

Si tocas algo que afecte a avisos, campana, push, vistas previas de enlaces, molas, «seguir» o gritos en vivo, **ejecuta las pruebas del sistema completo** desde el repo hermano `../dreamers-notificaciones`:

    cd ../dreamers-notificaciones && e2e/verificar.sh            # todo: unidad + e2e del servidor + e2e de navegador
    e2e/verificar.sh rapido                                       # solo unidad
    e2e/verificar.sh navegador                                    # Chrome real con el JS/CSS y la build reales

La tabla de «si tocas X, ejecuta Y» y lo que cubre cada capa esta en `../dreamers-notificaciones/CLAUDE.md`. Si cambias el DOM de una plantilla de dreamers (`tools/d26/templates/d26/`), actualiza tambien los fixtures de `e2e/navegador/dreamers.mjs`. No des nada por hecho sin haberlo pasado, y di con honestidad lo que no se pudo probar (el push a un movil con la app cerrada no se automatiza).
