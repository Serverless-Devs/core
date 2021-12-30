import { underline } from 'chalk';
export { default as request } from './request';
export { default as downloadRequest } from './downloadRequest';
export { default as reportComponent } from './reportComponent';
export { default as spinner } from './spinner';
export { default as zip } from './zip';
export { default as help } from './help';
export { loadComponent, load, loadApplication } from './load';
export { default as commandParse } from './commandParse';
export * from './credential';
export { getState, setState } from './state';
export { default as modifyProps } from './modifyProps';
export { default as installDependency } from './installDependency';
export { default as getYamlContent } from './getYamlContent';
export { default as report } from './report';
export { default as formatterOutput } from './formatterOutput';
export { default as publishHelp } from './publishHelp';
export const makeUnderLine = (text: string) => {
  const matchs = text.match(/http[s]?:\/\/[^\s]+/);
  if (matchs) {
    return text.replace(matchs[0], underline(matchs[0]));
  } else {
    return text;
  }
};
