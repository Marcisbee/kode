import theme from './vscode.json';

function find(match: string, fallback: string = 'lime') {
  let found = theme.tokenColors.find(({ scope }) => {
    if (Array.isArray(scope)) {
      return scope.includes(match);
    }

    return scope === match;
  });

  if (!found) {
    found = theme.tokenColors.find(({ scope }) => {
      if (Array.isArray(scope)) {
        return scope.join(',').includes(match);
      }

      return scope.includes(match);
    })
  }

  return found?.settings?.foreground || fallback;
}

export const AtomOneDark: Record<string, string> = {
  bg: theme.colors['editor.background'],
  plain: theme.colors['editor.foreground'],
  caret: theme.colors['editorCursor.foreground'],
  hidden: 'rgba(165,165,165,0.2)',
  'line-number': theme.colors['editorLineNumber.foreground'],

  'identifier': find('variable.property', theme.colors['editor.foreground']),
  'keyword': find('keyword'),
  'constant': find('constant'),
  'symbol': '#ed5f58',
  'comment': find('comment'),
  'tag': find('tag'),
  'selector': find('selector'),
  'atrule': find('atrule'),
  'attr': find('attr'),
  'prop': find('prop'),
  'value': find('value'),
  'variable': find('variable'),
  'entity': find('entity'),
  'prolog': '#7890cc',
  'string': find('string'),
  'number': find('constant'),
  'boolean': find('constant'),
  'function': find('entity.name.function'),
  'class': find('entity'),
  'decorator': find('decorator', theme.colors['editor.foreground']),
  'regexp': find('regexp'),
  'operator': find('keyword.operator', theme.colors['editor.foreground']),
  'bracket': find('brace', theme.colors['editor.foreground']),
  'delimiter': find('punctuation.delimiter', theme.colors['editor.foreground']),

  scrollbar: 'rgba(165,165,165,0.2)',
  diagnosticError: theme.colors['errorForeground'],
  guide: 'rgba(165,165,165,0.15)',
  selection: theme.colors['editor.selectionBackground'],
  'selected-line': theme.colors['editor.inactiveSelectionBackground'] || 'rgba(165,165,165,0.05)',
  'match-identifier': 'rgba(165,165,165,0.2)',
};
