describe('grapher', function () {
  var Grapher = Ayasdi.Grapher;
  var palette = [0x666666, 0x999999, 0xcccccc];

  it('contains palettes and textures', function () {
    expect(Grapher.palettes).toBeDefined();
    expect(Grapher.textures).toBeDefined();
  });

  xit('loads its textures', function (done) {
    expect(Grapher.load).toBeDefined();
    Grapher.load().then(done);
  });

  it('defines new palettes', function () {
    Grapher.setPalette('greyscale', palette);
    expect(Grapher.getPalette('greyscale')).toBeDefined();
    expect(Grapher.getTexture('nodes', 0xcccccc)).toBeDefined();
  });

  it('generates interpolated textures and swatches for links', function () {
    var swatch = Grapher.getPalette('greyscale')['0-1'];
    expect(swatch).toBeDefined();
    expect(Grapher.getTexture('links', swatch)).toBeDefined();
  });
});

describe('a grapher instance', function () {
  var Grapher = Ayasdi.Grapher;

  var width = 100,
      height = 100,
      options = {};

  var network, grapher;

  function getNodeCenter (node) {
    return node.position.x + node.width / 2;
  };

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
    grapher = new Grapher(width, height, options);
  });

  afterEach(function () {
    grapher = undefined;
  });

  it('has a renderer, view, stage, links, and nodes', function () {
    expect(grapher.renderer).toBeDefined();
    expect(grapher.view).toBeDefined();
    expect(grapher.stage).toBeDefined();
    expect(grapher.links).toBeDefined();
    expect(grapher.nodes).toBeDefined();
  });

  it('has sprite batches', function () {
    expect(grapher.batches).toBeDefined();
    expect(grapher.batches.links).toBeDefined();
    expect(grapher.batches.nodes).toBeDefined();
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
    grapher.data(network).render();

    var n = 0;
    network.nodes[n].x = -100;

    grapher.updateNode(n).render();
    expect(getNodeCenter(grapher.nodes[n])).toEqual(network.nodes[n].x);
  });

  it('updates links attached to updating nodes', function () {
    grapher.data(network).render();

    network.nodes[0].x = -100;
    grapher.update('nodes', [0]).render();

    expect(grapher.links[0].position.x).toEqual(network.nodes[0].x);
  });

  it('transforms', function () {
    var transform = {scale: 0.5, translate: [100, 200]};

    grapher.transform(transform);
    expect(grapher.network.scale.x).toEqual(transform.scale);
    expect(grapher.network.scale.y).toEqual(transform.scale);
    expect(grapher.network.position.x).toEqual(transform.translate[0]);
    expect(grapher.network.position.y).toEqual(transform.translate[1]);
  });

  it('resizes', function () {
    expect(grapher.resize).toBeDefined();
    grapher.resize(800, 600);
    expect(grapher.renderer.width).toBe(800);
    expect(grapher.renderer.height).toBe(600);
  });

  it('assigns custom mouse event handlers', function () {
    var handler = function () { return true; };
    grapher.on('nodes', 'mousedown', handler);
    grapher.on('nodes', 'mouseover', handler);
    grapher.on('nodes', 'mouseout', handler);

    // TODO: we may want to check that 'handler' is actually called on these events

    expect(grapher.listeners['nodes']['mousedown']).toBe(handler);
    expect(grapher.listeners['nodes']['mouseover']).toBe(handler);
    expect(grapher.listeners['nodes']['mouseout']).toBe(handler);
  });
});
