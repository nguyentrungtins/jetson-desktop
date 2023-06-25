import { IConfigs, ISecurityMode, IConfig } from '../renderer/types';
import axios from 'axios';
export const getConfigs = async () => {
  const configs = await axios.get<IConfigs>(
    'http://localhost:3000/api/v1/config/get-config'
  );
  const { data } = configs.data;
  const newConfigs = data.map((configForEachDay: IConfig) => {
    const {
      LST_DY_CTNT: weekday,
      ST_DT: start,
      END_DT: end,
      DOR_CTRL_CD: mode,
    } = configForEachDay;
    const configFilter: ISecurityMode = {
      weekday,
      start,
      end,
      mode,
    };
    return configFilter;
  });
  return newConfigs;
};
