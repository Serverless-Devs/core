import _  from 'lodash';
import wrap from 'word-wrap';
import { bold, underline }  from 'chalk';
import { isChinese } from '../libs/utils'

const keyFn = list => _.first(_.keys(list));
const descFn = list => _.first(_.values(list));

const publishHelper  =  {
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
        list = _.isArray(list) ? list: _.map(list,(item, key) => ({[key]:item}) );
        return _.map(list, item => keyFn(item)).reduce((a, c) => {
            return Math.max(a, c.length);
        }, 0) + 2;
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
        if(_.isPlainObject(list)) {
            if(_.isObject(descFn(list))) {
                return `${underline(bold(title))}` + _.reduce(list, (total, item, key) => {
                    total += `\n` + publishHelper.helpInfo(item, key, length, 2);
                    return total;
                  },'')
            }
        }
        list = _.isArray(list) ? list: _.map(list,(item, key) => ({[key]:item}) );
        if(_.isEmpty(list)) {
            return '';
        }
        return `${_.repeat(' ', leftPad)}${leftPad?bold(title):underline(bold(title))}\n` + _.reduce(list, (total, item) => {
            let description = descFn(item);
            if(isChinese(description) && description.lastIndexOf('.') <= -1) {
                description = `${description}.`;
            } 
            total+= (
                '  ' + _.padEnd(wrap(keyFn(item), {indent: _.repeat(' ', leftPad)}), length + 2) + wrap(description, {width: 80} ) + '\n');
            return total;
            },'')
    },
}

export default publishHelper;