import {encode, decode} from 'gpt-3-encoder';
const GPT4_TOKENS = 8192;
const GPT3_TOKENS = 16384;

export const encodeText = (text: string): number[] => {
    return encode(text);
}

export const calculateTokenRemainde = (text: string, model: string): number => {
    const tokens = encodeText(text);
    switch(model) {
        case 'gpt-4':
            return GPT4_TOKENS - tokens.length;
        case 'gpt-3':
            return GPT3_TOKENS - tokens.length;
        default:
            throw new Error(`Invalid model: ${model}`);
    }
}

export const getModelNumber = (model: string): number => {
    switch(model) {
        case 'gpt-4':
            return 4;
        case 'gpt-3':
            return 3;
        default:
            throw new Error(`Invalid model: ${model}`);
    }
};