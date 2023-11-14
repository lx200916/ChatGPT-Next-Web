import md5 from "spark-md5";
import { DEFAULT_MODELS } from "../constant";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PROXY_URL?: string; // docker only

      OPENAI_API_KEY?: string;
      CODE?: string;

      BASE_URL?: string;
      OPENAI_ORG_ID?: string; // openai only

      VERCEL?: string;
      BUILD_MODE?: "standalone" | "export";
      BUILD_APP?: string; // is building desktop app

      HIDE_USER_API_KEY?: string; // disable user's api key input
      DISABLE_GPT4?: string; // allow user to use gpt-4 or not
      ENABLE_BALANCE_QUERY?: string; // allow user to query balance or not
      DISABLE_FAST_LINK?: string; // disallow parse settings from url or not
      CUSTOM_MODELS?: string; // to control custom models
      SYSTEM_PROMPT?: string;
      DEFAULT_MODEL?: string;
      // enableAutoGenerateTitle
      AUTO_GENERATE_TITLE?: string;
      SEND_PREVIOUS_BUBBLE?: string;
      DONT_SHOW_MASK_SPLASH_SCREEN?: string;
      HIDE_BUILTIN_MASKS?: string;
      HISTORY_MESSAGE_COUNT?: string;
      SEND_MEMORY?: string;

      //Logo Customization
      LOGO_URL?: string;
      LOGO_TITLE?: string;
      LOGO_SUBTITLE?: string;

      // azure only
      AZURE_URL?: string; // https://{azure-url}/openai/deployments/{deploy-name}
      AZURE_API_KEY?: string;
      AZURE_API_VERSION?: string;
    }
  }
}

const ACCESS_CODES = (function getAccessCodes(): Set<string> {
  const code = process.env.CODE;

  try {
    const codes = (code?.split(",") ?? [])
      .filter((v) => !!v)
      .map((v) => md5.hash(v.trim()));
    return new Set(codes);
  } catch (e) {
    return new Set();
  }
})();

export const getServerSideConfig = () => {
  if (typeof process === "undefined") {
    throw Error(
      "[Server Config] you are importing a nodejs-only module outside of nodejs",
    );
  }

  const disableGPT4 = !!process.env.DISABLE_GPT4;
  let customModels = process.env.CUSTOM_MODELS ?? "chatglm3-6b";
  let defaultModel = process.env.DEFAULT_MODEL ?? "chatglm3-6b";
  let enableInjectSystemPrompts: boolean = process.env.SYSTEM_PROMPT
    ? true
    : false;
  if (disableGPT4) {
    if (customModels) customModels += ",";
    customModels += DEFAULT_MODELS.filter((m) => m.name.startsWith("gpt-4"))
      .map((m) => "-" + m.name)
      .join(",");
    if (defaultModel == "gpt-4") defaultModel = "";
  }
  const defaultConfigMap = {
    enableAutoGenerateTitle: !!process.env.AUTO_GENERATE_TITLE,
    sendPreviousBubble: !!process.env.SEND_PREVIOUS_BUBBLE,
    dontShowMaskSplashScreen: !!process.env.DONT_SHOW_MASK_SPLASH_SCREEN,
    hideBuiltinMasks: !!process.env.HIDE_BUILTIN_MASKS,
    modelConfig: {
      model: defaultModel,
      enableInjectSystemPrompts: enableInjectSystemPrompts,
      sendMemory: !!process.env.SEND_MEMORY,
      historyMessageCount: parseInt(process.env.HISTORY_MESSAGE_COUNT ?? "0"),
    },
    logo: {
      url: process.env.LOGO_URL ?? "",
      title: process.env.LOGO_TITLE ?? "My Chatbot",
      subtitle: process.env.LOGO_SUBTITLE ?? "",
      showLogo: !!process.env.LOGO_URL,
    },
  };

  const isAzure = !!process.env.AZURE_URL;

  return {
    baseUrl: process.env.BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
    openaiOrgId: process.env.OPENAI_ORG_ID,

    isAzure,
    azureUrl: process.env.AZURE_URL,
    azureApiKey: process.env.AZURE_API_KEY,
    azureApiVersion: process.env.AZURE_API_VERSION,

    needCode: ACCESS_CODES.size > 0,
    code: process.env.CODE,
    codes: ACCESS_CODES,

    proxyUrl: process.env.PROXY_URL,
    isVercel: !!process.env.VERCEL,

    hideUserApiKey: !!process.env.HIDE_USER_API_KEY,
    disableGPT4,
    hideBalanceQuery: !process.env.ENABLE_BALANCE_QUERY,
    disableFastLink: !!process.env.DISABLE_FAST_LINK,
    customModels,
    defaultModel,
    defaultConfigMap,
  };
};
