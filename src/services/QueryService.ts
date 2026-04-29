import { AxiosRequestConfig, Method } from "axios";
import { apiClient, learningClient, medicalClient } from "../api/apiClient";
import { alertService } from "./AlertService";

type ErrorPayload = {
    error?: boolean;
    msg?: string;
    msgs?: Record<string, string> | string[] | unknown;
};

export class QueryService {
    async executeQuery<T>(
        type: string,
        query: string,
        data: unknown,
    ): Promise<T> {
        const method = type.toUpperCase() as Method;
        const config: AxiosRequestConfig = {
            method,
            url: query,
        };

        if (method === "GET") {
            config.params = data;
        } else {
            config.data = data;
        }

        const res = await apiClient.request<T>(config);
        return res.data;
    }

    async executeQueryLearning<T>(
        type: string,
        query: string,
        data: unknown,
    ): Promise<T> {
        const method = type.toUpperCase() as Method;
        const config: AxiosRequestConfig = { method, url: query };
        if (method === "GET") {
            config.params = data;
        } else {
            config.data = data;
        }

        console.log({ ...config });
        const res = await learningClient.request<T>(config);
        return res.data;
    }

    async executeQueryMedical<T>(
        type: string,
        query: string,
        data: unknown,
    ): Promise<T> {
        const method = type.toUpperCase() as Method;
        const config: AxiosRequestConfig = { method, url: query };
        if (method === "GET") {
            config.params = data;
        } else {
            config.data = data;
        }
        const res = await medicalClient.request<T>(config);
        return res.data;
    }

    manageErrors(data_resp: ErrorPayload, _form?: unknown): void {
        if (!data_resp?.error) {
            return;
        }
        let msg = data_resp.msg ?? "Error";
        const { msgs } = data_resp;
        if (msgs) {
            if (Array.isArray(msgs)) {
                msg = msgs.map(String).join("\n");
            } else if (typeof msgs === "object") {
                msg = Object.values(msgs as Record<string, string>)
                    .map(String)
                    .join("\n");
            }
        }
        alertService.present("Simplex", msg);
    }
}

export const queryService = new QueryService();
