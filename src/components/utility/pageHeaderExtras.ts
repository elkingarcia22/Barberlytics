import * as React from "react";

/**
 * Lo que la aplicación quiere en la cabecera de *todas* sus pantallas, junto
 * a las acciones de cada una: el botón del agente de IA, por ejemplo. El
 * layout lo provee una vez y `PageHeader` lo pinta; ninguna pantalla tiene
 * que acordarse de ponerlo. Una pantalla que traiga el suyo lo pasa por la
 * prop `extras` y ese gana.
 */
const PageHeaderExtrasContext = React.createContext<React.ReactNode>(null);

export const PageHeaderExtrasProvider = PageHeaderExtrasContext.Provider;

export const usePageHeaderExtras = (): React.ReactNode => React.useContext(PageHeaderExtrasContext);
