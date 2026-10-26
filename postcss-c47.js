import postcss from 'postcss';
export default () => ({
  postcssPlugin: 'tflix-chromium47-layout',
  OnceExit(root) {
    root.walkRules(rule => {
      let display, direction = 'row', wrap = false, gap = '0px', columns = '';
      rule.walkDecls(decl => {
        if (decl.prop === 'display') display = decl.value;
        if (decl.prop === 'flex-direction') direction = decl.value;
        if (decl.prop === 'flex-wrap') wrap = decl.value === 'wrap';
        if (decl.prop === 'gap') { gap = decl.value; decl.remove(); }
        if (decl.prop === 'grid-template-columns') { columns = decl.value; decl.remove(); }
        if (decl.prop === 'inset') { ['top', 'right', 'bottom', 'left'].forEach(prop => decl.cloneBefore({prop})); decl.remove(); }
        if (decl.prop === 'justify-content' && decl.value === 'space-evenly') decl.value = 'space-around';
        if (['backdrop-filter', 'scroll-behavior', 'aspect-ratio'].includes(decl.prop)) decl.remove();
      });
      if (!rule.selector || rule.selector.includes('%')) return;
      const children = postcss.rule({selector: rule.selectors.map(s => s + ' > *').join(',')});
      if (display === 'grid') {
        rule.walkDecls('display', d => { d.value = 'flex'; });
        rule.append({prop:'flex-wrap',value:'wrap'});
        const fixed = /repeat\((\d+),/.exec(columns);
        const width = fixed ? `calc(${100 / Number(fixed[1])}% - ${gap})` : '160px';
        children.append({prop:'flex',value:`0 0 ${width}`});
        children.append({prop:'min-width',value:'0'});
        wrap = true;
      }
      if (gap !== '0px') {
        if (wrap) {
          children.append({prop:'margin-right',value:gap}, {prop:'margin-bottom',value:gap});
        } else {
          children.selector = rule.selectors.map(s => s + ' > * + *').join(',');
          children.append({prop: direction === 'column' ? 'margin-top' : 'margin-left',value:gap});
        }
      }
      if (children.nodes.length) rule.after(children);
    });
  }
});
