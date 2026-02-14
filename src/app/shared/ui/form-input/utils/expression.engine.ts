export class ExpressionEngine {

  private cache = new Map<string, Function>();

  private compile(expression: string) {
    let fn: Function;

    try {
      fn = new Function(
        'model',
        'context',
        'value',
        `return (${expression});`
      );
    } catch (err) {
      console.error('[Compile Error]', {
        expression,
        error: err
      });
      return () => undefined;
    }

    return (model: any, context: any, value: any) => {
      try {
        return fn(model, context, value);
      } catch (err) {
        console.error('[Runtime Error]', {
          expression,
          model,
          context,
          value,
          error: err
        });
        return undefined;
      }
    };
  }

  evaluate(expression: string, ctx: {
    model: any;
    context: any;
    value?: any;
  }): any {

    if (!this.cache.has(expression)) {
      this.cache.set(expression, this.compile(expression));
    }

    const fn = this.cache.get(expression)!;

    return fn(
      ctx.model,
      ctx.context,
      ctx.value
    );
  }

  renderTemplate(template: string, ctx: {
    model: any;
    context: any;
    value?: any;
  }): string {

    return template.replace(/\$\{([^}]+)\}/g, (_, expr) => {
      try {

        if (!this.cache.has(expr)) {
          this.cache.set(expr, this.compile(expr));
        }

        const fn = this.cache.get(expr)!;

        const result = fn(
          ctx.model,
          ctx.context,
          ctx.value
        );

        return result ?? '';

      } catch (err) {
        console.error('[Template Error]', {
          expression: expr,
          error: err
        });
        return '';
      }
    });
  }
}
