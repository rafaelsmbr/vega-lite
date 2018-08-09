"use strict";
/* tslint:disable quotemark */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chai_1 = require("chai");
var selection = tslib_1.__importStar(require("../../../src/compile/selection/selection"));
var inputs_1 = tslib_1.__importDefault(require("../../../src/compile/selection/transforms/inputs"));
var util_1 = require("../../util");
describe('Inputs Selection Transform', function () {
    var model = util_1.parseUnitModel({
        mark: 'circle',
        encoding: {
            x: { field: 'Horsepower', type: 'quantitative' },
            y: { field: 'Miles_per_Gallon', type: 'quantitative' },
            color: { field: 'Origin', type: 'nominal' }
        }
    });
    model.parseScale();
    var selCmpts = selection.parseUnitSelection(model, {
        one: {
            type: 'single',
            bind: { input: 'range', min: 0, max: 10, step: 1 }
        },
        two: {
            type: 'single',
            fields: ['Cylinders', 'Horsepower'],
            bind: { input: 'range', min: 0, max: 10, step: 1 }
        },
        three: {
            type: 'single',
            nearest: true,
            fields: ['Cylinders', 'Origin'],
            bind: {
                Horsepower: { input: 'range', min: 0, max: 10, step: 1 },
                Origin: { input: 'select', options: ['Japan', 'USA', 'Europe'] }
            }
        },
        four: {
            type: 'single',
            bind: null
        },
        six: {
            type: 'interval',
            bind: 'scales'
        }
    });
    it('identifies transform invocation', function () {
        chai_1.assert.isNotFalse(inputs_1.default.has(selCmpts['one']));
        chai_1.assert.isNotFalse(inputs_1.default.has(selCmpts['two']));
        chai_1.assert.isNotFalse(inputs_1.default.has(selCmpts['three']));
        chai_1.assert.isNotTrue(inputs_1.default.has(selCmpts['four']));
        chai_1.assert.isNotTrue(inputs_1.default.has(selCmpts['six']));
    });
    it('adds widget binding for default projection', function () {
        model.component.selection = { one: selCmpts['one'] };
        chai_1.assert.includeDeepMembers(selection.assembleUnitSelectionSignals(model, []), [
            {
                name: 'one_tuple',
                update: 'one__vgsid_ ? {fields: ["_vgsid_"], values: [one__vgsid_]} : null'
            }
        ]);
        chai_1.assert.includeDeepMembers(selection.assembleTopLevelSignals(model, []), [
            {
                name: 'one__vgsid_',
                value: '',
                on: [
                    {
                        events: [{ source: 'scope', type: 'click' }],
                        update: 'datum && item().mark.marktype !== \'group\' ? datum["_vgsid_"] : null'
                    }
                ],
                bind: { input: 'range', min: 0, max: 10, step: 1 }
            }
        ]);
    });
    it('adds single widget binding for compound projection', function () {
        model.component.selection = { two: selCmpts['two'] };
        chai_1.assert.includeDeepMembers(selection.assembleUnitSelectionSignals(model, []), [
            {
                name: 'two_tuple',
                update: 'two_Cylinders && two_Horsepower ? {fields: ["Cylinders", "Horsepower"], values: [two_Cylinders, two_Horsepower]} : null'
            }
        ]);
        chai_1.assert.includeDeepMembers(selection.assembleTopLevelSignals(model, []), [
            {
                name: 'two_Horsepower',
                value: '',
                on: [
                    {
                        events: [{ source: 'scope', type: 'click' }],
                        update: 'datum && item().mark.marktype !== \'group\' ? datum["Horsepower"] : null'
                    }
                ],
                bind: { input: 'range', min: 0, max: 10, step: 1 }
            },
            {
                name: 'two_Cylinders',
                value: '',
                on: [
                    {
                        events: [{ source: 'scope', type: 'click' }],
                        update: 'datum && item().mark.marktype !== \'group\' ? datum["Cylinders"] : null'
                    }
                ],
                bind: { input: 'range', min: 0, max: 10, step: 1 }
            }
        ]);
    });
    it('adds projection-specific widget bindings', function () {
        model.component.selection = { three: selCmpts['three'] };
        chai_1.assert.includeDeepMembers(selection.assembleUnitSelectionSignals(model, []), [
            {
                name: 'three_tuple',
                update: 'three_Cylinders && three_Origin ? {fields: ["Cylinders", "Origin"], values: [three_Cylinders, three_Origin]} : null'
            }
        ]);
        chai_1.assert.includeDeepMembers(selection.assembleTopLevelSignals(model, []), [
            {
                name: 'three_Origin',
                value: '',
                on: [
                    {
                        events: [{ source: 'scope', type: 'click' }],
                        update: 'datum && item().mark.marktype !== \'group\' ? (item().isVoronoi ? datum.datum : datum)["Origin"] : null'
                    }
                ],
                bind: {
                    input: 'select',
                    options: ['Japan', 'USA', 'Europe']
                }
            },
            {
                name: 'three_Cylinders',
                value: '',
                on: [
                    {
                        events: [{ source: 'scope', type: 'click' }],
                        update: 'datum && item().mark.marktype !== \'group\' ? (item().isVoronoi ? datum.datum : datum)["Cylinders"] : null'
                    }
                ],
                bind: {
                    Horsepower: { input: 'range', min: 0, max: 10, step: 1 },
                    Origin: {
                        input: 'select',
                        options: ['Japan', 'USA', 'Europe']
                    }
                }
            }
        ]);
    });
});
//# sourceMappingURL=inputs.test.js.map