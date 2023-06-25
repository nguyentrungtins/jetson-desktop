export interface IConfigs {
  data: Config[];
}

export interface IConfig {
  CFG_ID: number;
  BX_ID: null | string;
  CFG_NM: null;
  ST_DT: string;
  END_DT: string;
  MSG: null;
  LST_DY_CTNT: string;
  USE_CFG_FLG: null;
  DOR_CTRL_CD: string;
  CRE_DT: Date;
  CRE_USR_ID: null;
  UPD_DT: null;
  UPD_USR_ID: null;
}
// export type ISecurityMode = Pick<
//   Config,
//   'LST_DY_CTNT' | 'ST_DT' | 'END_DT' | 'DOR_CTRL_CD'
// >;
export interface ISecurityMode {
  weekday: string;
  start: string;
  end: string;
  mode: string;
}
export interface IUserCheckinData {
  userId: string;
  userName: string;
  image: string;
  isUnknown: boolean;
  punchtime: Date;
  similarity: number;
  punchTime: Date;
  createDate: Date;
  updateDate: Date;
  flagSend: number;
}
export interface Pincode {
  data: Data;
  success: number;
}

export interface Data {
  USR_ID: string;
  ROLE_ID: null;
  USR_NM: string;
  USR_PWD: null;
  FULL_NM: string;
  BRDY_VAL: null;
  OFC_CD: string;
  ACTIVE: number;
  GND_VAL: null;
  CO_CD: null;
  PIN_CD: string;
  TP_VAL: null;
  IP_LGIN_VAL: null;
  LGIN_TM_DT: null;
  IS_LGIN_FLG: null;
  CRE_DT: string;
  CRE_USR: string;
  UPD_DT: string;
  UPD_USR: string;
  TYPE: number;
}
