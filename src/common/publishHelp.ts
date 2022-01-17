import _ from 'lodash';
import tableLayout from 'table-layout';
import { bold, underline } from 'chalk';
import { makeUnderLine } from '../libs/utils';

const keyFn = (list) => _.first(_.keys(list));
const descFn = (list) => _.first(_.values(list));

const publishHelper = {
  /**
     * 
     * Options: [
            {'--debug': 'Open debug model.'},
            {'--skip-actions': 'Skip the extends section.'},
            {'-t, --template <path>': 'Specify the template file.'},
            {'-a, --access <aliasName>': 'Specify the access alias name.'},
            {'-v, --version': 'Output the version number.'},
            {'-h, --help': 'Display help for command.'},
        ]
     * @param list 
     */
  maxLen: (list) => {
    list = _.isArray(list) ? list : _.map(list, (item, key) => ({ [key]: item }));
    return (
      _.map(list, (item) => keyFn(item)).reduce((a, c) => {
        return Math.max(a, c.length);
      }, 0) + 2
    );
  },
  /**
   *
   * @param list 初始化数据
   * @param title 名称
   * @param length 整体长度
   * @param leftPad 距离左侧长度
   * @returns
   */
  helpInfo: (list, title, length, leftPad = 0) => {
    if (_.isPlainObject(list) && _.isObject(descFn(list))) {
      return (
        `${underline(bold(title))}` +
        _.reduce(
          list,
          (total, item, key) => {
            total += `\n` + publishHelper.helpInfo(item, key, length - 2, 2);
            return total;
          },
          '',
        )
      );
    }
    list = _.isArray(list)
      ? _.map(list, (item) => ({
          command: [keyFn(item)],
          desc: descFn(item),
        }))
      : _.map(list, (item, key) => ({ command: key, desc: item }));
    if (_.isEmpty(list)) {
      return '';
    }
    const proxy = list.map((row) => {
      return new Proxy(row, {
        get(target, property, receiver) {
          if (property === 'desc') {
            return `${makeUnderLine(target.desc)}`;
          } else {
            return Reflect.get(target, property, receiver);
          }
        },
      });
    });
    return (
      `${_.repeat(' ', leftPad)}${leftPad ? bold(title) : underline(bold(title))}\n` +
      new tableLayout(proxy, {
        padding: { left: _.repeat(' ', leftPad + 2) },
        columns: [
          {
            name: 'command',
            width: length + 2,
          },
        ],
      }).toString()
    );
    // `${_.repeat(' ', leftPad)}${leftPad?bold(title):underline(bold(title))}\n` + _.reduce(list, (total, item) => {
    //     let description = descFn(item);
    //     total+= (
    //         '  ' + _.padEnd(wrap(keyFn(item), {indent: _.repeat(' ', leftPad)}), length + 2) + wrap(description, {width: 80} ) + '\n');
    //     return total;
    //     },'')
  },
};

export default publishHelper;
