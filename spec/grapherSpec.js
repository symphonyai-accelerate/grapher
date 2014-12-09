describe('grapher', function () {
  var Grapher = Ayasdi.Grapher;

  it('contains textures for links and nodes', function () {
    expect(Grapher.textures).toBeDefined();
    expect(Grapher.textures.link).toBeDefined();
    expect(Grapher.textures.node).toBeDefined();
  });

  xit('can load its textures', function (done) {
    expect(Grapher.load).toBeDefined();
    Grapher.load().then(done);
  });

  it('contains palettes', function () {
    expect(Grapher.palettes).toBeDefined();
  });

  it('can define new palettes', function () {
    var palette = [0x000000, 0x333333, 0x666666, 0x999999];
    Grapher.setPalette('greyscale', palette);

    var returnedPalette = Grapher.getPalette('greyscale');
    expect(returnedPalette).toBeDefined();
  });

  it('has textures after defining palettes', function () {
    var texture = Grapher.getTexture('node', 0x000000);
    expect(texture).toBeDefined();
  });
});

describe('a grapher instance', function () {
  var Grapher = Ayasdi.Grapher;

  var width = 100,
      height = 100,
      options = {};

  var network = {nodes: [], links: []};

  var grapher;

  beforeEach(function () {
    network = {
      nodes: [
        {x: 0, y: 0, radius: 20},
        {x: 1, y: 1, radius: 15},
        {x: 1, y: 2, radius: 25}
      ],
      links: [
        {source: {x: 1, y: 1}, target: {x: 0, y: 0}},
        {source: {x: 1, y: 2}, target: {x: 0, y: 0}}
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
    expect(grapher.batches.link).toBeDefined();
    expect(grapher.batches.node).toBeDefined();
  });

  it('can create or remove nodes and links', function () {
    grapher.data(network);
    expect(grapher.nodes.length).toEqual(network.nodes.length);
    expect(grapher.links.length).toEqual(network.links.length);
  });

  it('can update the position of nodes and links', function () {
    grapher.data(network);
    network.nodes[0].x = 2;
    grapher.update();

    var node = grapher.nodes.getChildAt(0);
    expect(node.position.x).toEqual(network.nodes[0].x);
  });
});
