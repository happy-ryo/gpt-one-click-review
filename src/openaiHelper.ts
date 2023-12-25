import { encode } from 'gpt-3-encoder';
import * as vscode from 'vscode';
const GPT4_TOKENS = 8192;
const GPT3_TOKENS = 16384;

export const encodeText = (text: string): number[] => {
    return encode(text);
};

export const calculateTokenRemainde = (text: string, model: string): number => {
    const tokens = encodeText(text);
    switch (model) {
        case 'gpt-4':
            return GPT4_TOKENS - tokens.length;
        case 'gpt-3.5-turbo-16k-0613':
            return GPT3_TOKENS - tokens.length;
        default:
            throw new Error(`Invalid model: ${model}`);
    }
};

export const getModelNumber = (model: string): number => {
    switch (model) {
        case 'gpt-4':
            return 4;
        case 'gpt-3.5-turbo-16k-0613':
            return 3;
        default:
            throw new Error(`Invalid model: ${model}`);
    }
};

export const getOpenAiApiKey = (): string => {
    const configuration = vscode.workspace.getConfiguration('gpt-one-click-review');
    const key = configuration.get('openaiApiKey');
    if (!key || typeof key !== 'string') {
        vscode.window.showErrorMessage('Please set your OpenAI API key in the settings');
        throw new Error('OpenAI API key not set');
    }

    return key;
};

export const getTempreture = (): number => {
    const configuration = vscode.workspace.getConfiguration('gpt-one-click-review');
    const temperature = configuration.get<number>('openaiTempreture');
    if (temperature! < 0.1 || temperature! > 1 || typeof temperature !== 'number') {
        return 0.8;
    }

    return temperature;
};

export enum GptModel {
    gpt4 = 'gpt-4',
    gpt3 = 'gpt-3.5-turbo-16k-0613'
}
