describe('grapher', function () {
  var Grapher = Ayasdi.Grapher;
  var palette = [0x666666, 0x999999, 0xcccccc];

  it('contains palettes', function () {
    expect(Grapher.palettes).toBeDefined();
  });

  it('defines new palettes', function () {
    Grapher.setPalette('greyscale', palette);
    expect(Grapher.getPalette('greyscale')).toBeDefined();
  });

  it('generates interpolated textures and swatches for links', function () {
    var swatch = Grapher.getPalette('greyscale')['0-1'];
    expect(swatch).toBeDefined();
  });
});

describe('a grapher instance', function () {
  var Grapher = Ayasdi.Grapher;

  var options = {width: 100, height: 100};

  var network, grapher;

  function getNodeCenter (node) {
    return node.x;
  }

  beforeEach(function () {
    network = {
      nodes: [
        {x: 0, y: 0, r: 20},
        {x: 1, y: 1, r: 15},
        {x: 1, y: 2, r: 25}
      ],
      links: [
        {from: 0, to: 1},
        {from: 1, to: 2}
      ]
    };
    grapher = new Grapher(options);
  });

  afterEach(function () {
    grapher = undefined;
  });

  it('has a renderer, canvas, links, and nodes', function () {
    expect(grapher.renderer).toBeDefined();
    expect(grapher.canvas).toBeDefined();
    expect(grapher.links).toBeDefined();
    expect(grapher.nodes).toBeDefined();
  });

  it('sets and retrieves data', function () {
    grapher.data(network);
    expect(grapher.data()).toBe(network);
  });

  it('creates or removes nodes and links when setting data', function () {
    grapher.data(network);
    expect(grapher.nodes.length).toEqual(network.nodes.length);
    expect(grapher.links.length).toEqual(network.links.length);
  });

  it('updates the position of nodes and links', function () {
    grapher.data(network);
    network.nodes[0].x = 2;
    grapher.update().render();

    expect(getNodeCenter(grapher.nodes[0])).toEqual(network.nodes[0].x);
  });

  it('updates a range of nodes and links', function () {
    grapher.data(network);

    network.nodes[0].x = 2;
    network.nodes[1].x = 5;

    grapher.update('nodes', 0, 2).render();

    expect(getNodeCenter(grapher.nodes[0])).toEqual(network.nodes[0].x);
    expect(getNodeCenter(grapher.nodes[1])).toEqual(network.nodes[1].x);
  });

  it('updates specific nodes and links by an array of indices', function () {
    grapher.data(network);

    network.nodes[0].x = 2;
    network.nodes[1].x = 5;

    grapher.update('nodes', [0, 1]).render();

    expect(getNodeCenter(grapher.nodes[0])).toEqual(network.nodes[0].x);
    expect(getNodeCenter(grapher.nodes[1])).toEqual(network.nodes[1].x);
  });

  it('updates nodes or links individually by index', function () {
    expect(grapher.updateNode).toBeDefined();
    expect(grapher.updateLink).toBeDefined();
    grapher.data(network);

    var n = 0;
    network.nodes[n].x = -100;

    grapher.updateNode(n);
    grapher.render();
    expect(getNodeCenter(grapher.nodes[n])).toEqual(network.nodes[n].x);
  });

  it('updates links attached to updating nodes', function () {
    grapher.data(network);

    network.nodes[0].x = -100;
    grapher.update('nodes', [0]).render();

    expect(grapher.links[0].x1).toEqual(network.nodes[0].x);
  });

  it('transforms', function () {
    var transform = {scale: 0.5, translate: [100, 200]};

    grapher.transform(transform);
    expect(grapher.scale()).toEqual(transform.scale);
    expect(grapher.translate()[0]).toEqual(transform.translate[0]);
    expect(grapher.translate()[1]).toEqual(transform.translate[1]);
  });

  it('resizes', function () {
    expect(grapher.resize).toBeDefined();
    grapher.resize(800, 600);
    expect(grapher.canvas.width).toBe(800 * devicePixelRatio);
    expect(grapher.canvas.height).toBe(600 * devicePixelRatio);
  });

  it('can set custom event handlers', function () {
    var handler = function () { return true; },
        e = 'someEvent';
    grapher.on(e, handler);
    expect(grapher.handlers[e][0]).toBe(handler);
  });
});
