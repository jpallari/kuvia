const { StateList } = require('./kuvia');

describe('StateList', () => {
  test('last index', () => {
    expect(new StateList(['foo', 'bar', 'baz']).lastIndex()).toEqual(2);
    expect(new StateList(['foo', 'bar', 'baz', 'zap']).lastIndex()).toEqual(3);
  });

  test('traversing list forwards should wrap', () => {
    const items = ['foo', 'bar', 'baz'];
    const sl = new StateList(items);

    expect(sl.currentItem()).toEqual('foo');
    expect(sl.currentIndex).toEqual(0);

    expect(sl.next()).toEqual('bar');
    expect(sl.currentItem()).toEqual('bar');
    expect(sl.currentIndex).toEqual(1);

    expect(sl.next()).toEqual('baz');
    expect(sl.currentItem()).toEqual('baz');
    expect(sl.currentIndex).toEqual(2);

    expect(sl.next()).toEqual('foo');
    expect(sl.currentItem()).toEqual('foo');
    expect(sl.currentIndex).toEqual(0);
  });

  test('traversing list backwards should wrap', () => {
    const items = ['foo', 'bar', 'baz'];
    const sl = new StateList(items);

    expect(sl.previous()).toEqual('baz');
    expect(sl.currentItem()).toEqual('baz');
    expect(sl.currentIndex).toEqual(2);

    expect(sl.previous()).toEqual('bar');
    expect(sl.currentItem()).toEqual('bar');
    expect(sl.currentIndex).toEqual(1);

    expect(sl.previous()).toEqual('foo');
    expect(sl.currentItem()).toEqual('foo');
    expect(sl.currentIndex).toEqual(0);
  });

  test('jumping to an index', () => {
    const items = ['foo', 'bar', 'baz', 'zap'];
    const sl = new StateList(items);

    expect(sl.setCurrentIndex(2)).toEqual('baz');
    expect(sl.currentItem()).toEqual('baz');
    expect(sl.currentIndex).toEqual(2);
  });

  test('jumping to an invalid index returns to first item', () => {
    const items = ['foo', 'bar', 'baz', 'zap'];
    const sl = new StateList(items);

    expect(sl.setCurrentIndex(items.length)).toEqual('foo');
    expect(sl.currentItem()).toEqual('foo');
    expect(sl.currentIndex).toEqual(0);
  });

  test('resetting list', () => {
    const items = ['foo', 'bar', 'baz'];
    const sl = new StateList(items);

    sl.next();
    sl.setList(['eka', 'toka']);

    expect(sl.currentItem()).toEqual('eka');
    expect(sl.next()).toEqual('toka');
    expect(sl.next()).toEqual('eka');
  });

  test('setting by item', () => {
    const items = ['foo', 'bar', 'baz', 'zap'];
    const sl = new StateList(items, (item) => item);

    expect(sl.setCurrentItem('baz')).toEqual('baz');
    expect(sl.currentItem()).toEqual('baz');
    expect(sl.currentIndex).toEqual(2);
  });

  test('removal of non-existing item', () => {
    const items = ['foo', 'bar', 'baz'];
    const sl = new StateList(items, (item) => item);

    expect(sl.removeItem('zap')).toEqual(null);
  });

  test('removal of existing item on previous item', () => {
    const items = ['foo', 'bar', 'baz'];
    const sl = new StateList(items, (item) => item);

    expect(sl.removeItem('bar')).toEqual('foo');
    expect(sl.currentIndex).toEqual(0);
    expect(sl.next()).toEqual('baz');
  });

  test('removal of existing item on next item', () => {
    const items = ['foo', 'bar', 'baz'];
    const sl = new StateList(items, (item) => item);

    sl.setCurrentIndex(2);

    expect(sl.removeItem('bar')).toEqual('baz');
    expect(sl.currentIndex).toEqual(1);
    expect(sl.previous()).toEqual('foo');
  });
});
