/**
 * Tests for jQuery 3.7.1 functionality
 * Verifying core jQuery features and compatibility
 */

// Load jQuery 3.7.1 from node_modules
const $ = require('jquery');

describe('jQuery 3.7.1', () => {
  // Set up jQuery globals for each test
  beforeAll(() => {
    global.$ = global.jQuery = $;
  });

  // Clean up after all tests
  afterAll(() => {
    delete global.$;
    delete global.jQuery;
  });
  // Test that jQuery is loaded and available
  test('jQuery is loaded and available', () => {
    expect(typeof $).toBe('function');
    expect(typeof jQuery).toBe('function');
    expect($ === jQuery).toBe(true);
  });

  // Test jQuery version
  test('jQuery version is 3.7.1', () => {
    expect($.fn.jquery).toBe('3.7.1');
    expect(jQuery.fn.jquery).toBe('3.7.1');
  });

  // Test jQuery selector functionality
  test('jQuery selector works', () => {
    document.body.innerHTML = '<div id="test-div" class="test-class">Test Content</div>';
    
    const byId = $('#test-div');
    expect(byId.length).toBe(1);
    expect(byId.text()).toBe('Test Content');
    
    const byClass = $('.test-class');
    expect(byClass.length).toBe(1);
    expect(byClass.attr('id')).toBe('test-div');
  });

  // Test jQuery DOM manipulation
  test('jQuery DOM manipulation works', () => {
    document.body.innerHTML = '<div id="container"></div>';
    
    const container = $('#container');
    container.append('<p id="para1">Paragraph 1</p>');
    container.append('<p id="para2">Paragraph 2</p>');
    
    expect(container.children().length).toBe(2);
    expect($('#para1').text()).toBe('Paragraph 1');
    expect($('#para2').text()).toBe('Paragraph 2');
  });

  // Test jQuery CSS manipulation
  test('jQuery CSS manipulation works', () => {
    document.body.innerHTML = '<div id="styled-div">Styled</div>';
    
    const div = $('#styled-div');
    div.css('color', 'red');
    div.css('font-size', '16px');
    
    expect(div.css('color')).toBeTruthy();
    expect(div.css('font-size')).toBeTruthy();
  });

  // Test jQuery attribute manipulation
  test('jQuery attribute manipulation works', () => {
    document.body.innerHTML = '<div id="attr-div" data-value="initial"></div>';
    
    const div = $('#attr-div');
    expect(div.attr('data-value')).toBe('initial');
    
    div.attr('data-value', 'updated');
    expect(div.attr('data-value')).toBe('updated');
    
    div.removeAttr('data-value');
    expect(div.attr('data-value')).toBeUndefined();
  });

  // Test jQuery class manipulation
  test('jQuery class manipulation works', () => {
    document.body.innerHTML = '<div id="class-div" class="initial"></div>';
    
    const div = $('#class-div');
    expect(div.hasClass('initial')).toBe(true);
    
    div.addClass('added');
    expect(div.hasClass('added')).toBe(true);
    
    div.removeClass('initial');
    expect(div.hasClass('initial')).toBe(false);
    
    div.toggleClass('toggled');
    expect(div.hasClass('toggled')).toBe(true);
    
    div.toggleClass('toggled');
    expect(div.hasClass('toggled')).toBe(false);
  });

  // Test jQuery show/hide functionality
  test('jQuery show/hide works', () => {
    document.body.innerHTML = '<div id="visibility-div">Content</div>';
    
    const div = $('#visibility-div');
    
    div.hide();
    expect(div.css('display')).toBe('none');
    
    div.show();
    expect(div.css('display')).not.toBe('none');
  });

  // Test jQuery each iteration
  test('jQuery each iteration works', () => {
    document.body.innerHTML = `
      <div class="item">Item 1</div>
      <div class="item">Item 2</div>
      <div class="item">Item 3</div>
    `;
    
    const items = $('.item');
    expect(items.length).toBe(3);
    
    const texts = [];
    items.each(function() {
      texts.push($(this).text());
    });
    
    expect(texts).toEqual(['Item 1', 'Item 2', 'Item 3']);
  });

  // Test jQuery data storage
  test('jQuery data storage works', () => {
    document.body.innerHTML = '<div id="data-div"></div>';
    
    const div = $('#data-div');
    
    div.data('key1', 'value1');
    div.data('key2', 123);
    div.data('key3', { nested: 'object' });
    
    expect(div.data('key1')).toBe('value1');
    expect(div.data('key2')).toBe(123);
    expect(div.data('key3')).toEqual({ nested: 'object' });
  });

  // Test jQuery event handling
  test('jQuery event handling works', () => {
    document.body.innerHTML = '<button id="test-button">Click me</button>';
    
    const button = $('#test-button');
    let clickCount = 0;
    
    button.on('click', function() {
      clickCount++;
    });
    
    button.trigger('click');
    expect(clickCount).toBe(1);
    
    button.trigger('click');
    expect(clickCount).toBe(2);
    
    button.off('click');
    button.trigger('click');
    expect(clickCount).toBe(2); // Should not increment after off()
  });

  // Test jQuery find and filter
  test('jQuery find and filter work', () => {
    document.body.innerHTML = `
      <div id="parent">
        <div class="child">Child 1</div>
        <div class="child special">Child 2</div>
        <div class="child">Child 3</div>
      </div>
    `;
    
    const parent = $('#parent');
    const children = parent.find('.child');
    expect(children.length).toBe(3);
    
    const special = children.filter('.special');
    expect(special.length).toBe(1);
    expect(special.text()).toBe('Child 2');
  });

  // Test jQuery HTML content manipulation
  test('jQuery HTML content manipulation works', () => {
    document.body.innerHTML = '<div id="html-div">Original</div>';
    
    const div = $('#html-div');
    expect(div.html()).toBe('Original');
    
    div.html('<strong>Updated</strong>');
    expect(div.html()).toBe('<strong>Updated</strong>');
    expect(div.find('strong').length).toBe(1);
  });

  // Test jQuery text content manipulation
  test('jQuery text content manipulation works', () => {
    document.body.innerHTML = '<div id="text-div"><strong>Bold</strong> Text</div>';
    
    const div = $('#text-div');
    expect(div.text()).toBe('Bold Text');
    
    div.text('Plain Text');
    expect(div.text()).toBe('Plain Text');
    expect(div.find('strong').length).toBe(0); // HTML stripped
  });

  // Test jQuery parent/children navigation
  test('jQuery DOM navigation works', () => {
    document.body.innerHTML = `
      <div id="grandparent">
        <div id="parent">
          <div id="child">Child</div>
        </div>
      </div>
    `;
    
    const child = $('#child');
    const parent = child.parent();
    expect(parent.attr('id')).toBe('parent');
    
    const grandparent = child.parents('#grandparent');
    expect(grandparent.length).toBe(1);
    expect(grandparent.attr('id')).toBe('grandparent');
  });

  // Test jQuery AJAX setup (without actual AJAX calls)
  test('jQuery AJAX methods exist', () => {
    expect(typeof $.ajax).toBe('function');
    expect(typeof $.get).toBe('function');
    expect(typeof $.post).toBe('function');
    expect(typeof $.getJSON).toBe('function');
  });

  // Test jQuery utility functions
  test('jQuery utility functions work', () => {
    expect($.isArray([])).toBe(true);
    expect($.isArray({})).toBe(false);
    
    expect($.isFunction(function() {})).toBe(true);
    expect($.isFunction(123)).toBe(false);
    
    expect($.isPlainObject({})).toBe(true);
    expect($.isPlainObject([])).toBe(false);
    
    const merged = $.extend({}, { a: 1 }, { b: 2 });
    expect(merged).toEqual({ a: 1, b: 2 });
  });

  // Test jQuery ready function (document ready)
  test('jQuery ready function exists', () => {
    expect(typeof $(document).ready).toBe('function');
    expect(typeof $).toBe('function');
    
    // Test that we can call ready without errors
    // Note: In some test environments, ready may not fire synchronously
    $(document).ready(function() {
      // Ready handler executed
    });
    
    // Ready should exist and be callable (behavior may vary in test environment)
    expect(typeof $(document).ready).toBe('function');
  });

  // Test jQuery Deferred/Promise functionality
  test('jQuery Deferred works', () => {
    const deferred = $.Deferred();
    let resolveValue = null;
    
    deferred.done(function(value) {
      resolveValue = value;
    });
    
    deferred.resolve('test value');
    expect(resolveValue).toBe('test value');
  });

  // Test jQuery when for promise handling
  test('jQuery when works', () => {
    const deferred1 = $.Deferred();
    const deferred2 = $.Deferred();
    
    let whenResolved = false;
    $.when(deferred1, deferred2).done(function() {
      whenResolved = true;
    });
    
    expect(whenResolved).toBe(false);
    
    deferred1.resolve();
    expect(whenResolved).toBe(false);
    
    deferred2.resolve();
    expect(whenResolved).toBe(true);
  });

  // Test jQuery animation methods exist (even if we don't test animation timing)
  test('jQuery animation methods exist', () => {
    document.body.innerHTML = '<div id="animate-div">Content</div>';
    const div = $('#animate-div');
    
    expect(typeof div.fadeIn).toBe('function');
    expect(typeof div.fadeOut).toBe('function');
    expect(typeof div.slideDown).toBe('function');
    expect(typeof div.slideUp).toBe('function');
    expect(typeof div.animate).toBe('function');
  });

  // Test jQuery val() for form elements
  test('jQuery val() works with form elements', () => {
    document.body.innerHTML = `
      <input type="text" id="text-input" value="initial" />
      <select id="select-input">
        <option value="opt1">Option 1</option>
        <option value="opt2" selected>Option 2</option>
      </select>
    `;
    
    const textInput = $('#text-input');
    expect(textInput.val()).toBe('initial');
    
    textInput.val('updated');
    expect(textInput.val()).toBe('updated');
    
    const selectInput = $('#select-input');
    expect(selectInput.val()).toBe('opt2');
  });

  // Test jQuery empty() method
  test('jQuery empty() works', () => {
    document.body.innerHTML = '<div id="empty-div"><p>Content</p></div>';
    
    const div = $('#empty-div');
    expect(div.children().length).toBe(1);
    
    div.empty();
    expect(div.children().length).toBe(0);
    expect(div.html()).toBe('');
  });

  // Test jQuery remove() method
  test('jQuery remove() works', () => {
    document.body.innerHTML = `
      <div id="container">
        <div id="remove-me">Remove</div>
        <div id="keep-me">Keep</div>
      </div>
    `;
    
    const container = $('#container');
    expect(container.children().length).toBe(2);
    
    $('#remove-me').remove();
    expect(container.children().length).toBe(1);
    expect($('#remove-me').length).toBe(0);
    expect($('#keep-me').length).toBe(1);
  });

  // Test jQuery siblings()
  test('jQuery siblings() works', () => {
    document.body.innerHTML = `
      <div id="container">
        <div id="sibling1">1</div>
        <div id="sibling2">2</div>
        <div id="sibling3">3</div>
      </div>
    `;
    
    const sibling2 = $('#sibling2');
    const siblings = sibling2.siblings();
    
    expect(siblings.length).toBe(2);
  });

  // Test jQuery prop() method (for properties vs attributes)
  test('jQuery prop() works', () => {
    document.body.innerHTML = '<input type="checkbox" id="checkbox" />';
    
    const checkbox = $('#checkbox');
    expect(checkbox.prop('checked')).toBe(false);
    
    checkbox.prop('checked', true);
    expect(checkbox.prop('checked')).toBe(true);
    
    checkbox.prop('checked', false);
    expect(checkbox.prop('checked')).toBe(false);
  });
});
