import axios from "axios";
import { API_BASE } from "../config/api.config";

const http = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
});

export default http;
