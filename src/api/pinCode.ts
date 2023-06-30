import axios from 'axios';
import { Pincode, ResponseDataForDoorMode } from 'renderer/types';

const checkPinCode = async (userId, pinCode) => {
  const response = await axios.post<Pincode>(
    'http://localhost:3000/api/v1/login/checkPinCode/',
    {
      userId,
      pinCode,
    }
  );
  if (response.data.success === 1) {
    return true;
  }
  return false;
};
export default checkPinCode;
