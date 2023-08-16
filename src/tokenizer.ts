import {encode, decode} from 'gpt-3-encoder';


export const encodeText = (text: string): number[] => {
    return encode(text);
}