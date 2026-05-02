import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";
import Handlebars from "handlebars";
import { httpRequestChannel } from "@/inngest/channels/http-request";

//Might change when get Error: if http post method gives any error try this method and remove the noEscape:true from endpoint and resolved variable
/****
 Handlebar.registerHelper("json",(context)=>{
 const jsonString=JSON.stringify(context,null,2);
 const safeString=new Handlebars.SafeString(jsonString);
 return safeString;
 })
 */

Handlebars.registerHelper("json", (context) =>
  JSON.stringify(context, null, 2),
);
type HttpRequestData = {
  variableName?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};
export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(httpRequestChannel.status, {
    nodeId,
    status: "loading",
  });

  try {
    const result = await step.run("http-request", async () => {
      if (!data.endpoint) {
        await publish(httpRequestChannel.status, {
          nodeId,
          status: "error",
        });
        throw new NonRetriableError(
          "HTTP Request node: No endpoint configured",
        );
      }
      if (!data.variableName) {
        await publish(httpRequestChannel.status, {
          nodeId,
          status: "error",
        });
        throw new NonRetriableError(
          "Variable Name is not configured for this http request",
        );
      }
      if (!data.method) {
        await publish(httpRequestChannel.status, {
          nodeId,
          status: "error",
        });
        throw new NonRetriableError("Method not configured");
      }
      const endpoint = Handlebars.compile(data.endpoint, { noEscape: true })(
        context,
      );
      const method = data.method;
      const options: KyOptions = { method };
      if (["POST", "PUT", "PATCH"].includes(method)) {
        const resolved = Handlebars.compile(data.body || "{}", {
          noEscape: true,
        })(context);
        JSON.parse(resolved);
        options.body = resolved;
        options.headers = {
          "Content-Type": "application/json",
        };
      }
      const response = await ky(endpoint, options);
      const contentType = response.headers.get("content-type");
      const responseData = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      const responsePayload = {
        httpResponse: {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        },
      };
      return {
        ...context,
        [data.variableName]: responsePayload,
      };
    });
    await publish(httpRequestChannel.status, {
      nodeId,
      status: "success",
    });
    return result;
  } catch (error) {
    await publish(httpRequestChannel.status, {
      nodeId,
      status: "error",
    });
    throw error;
  }
};
