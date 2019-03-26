import { COUNTING_OPS } from '../src/aggregate';
import { CHANNELS } from '../src/channel';
import { channelCompatibility, defaultTitle, defaultType, normalize, vgField } from '../src/fielddef';
import * as log from '../src/log';
import { TimeUnit } from '../src/timeunit';
import { QUANTITATIVE, TEMPORAL } from '../src/type';
describe('fieldDef', () => {
    describe('vgField()', () => {
        it('should access flattened fields', () => {
            expect(vgField({ field: 'foo.bar\\.baz' })).toEqual('foo\\.bar\\.baz');
        });
        it('should access flattened fields in expression', () => {
            expect(vgField({ field: 'foo.bar\\.baz' }, { expr: 'datum' })).toEqual('datum["foo.bar.baz"]');
        });
    });
    describe('defaultType()', () => {
        it('should return temporal if there is timeUnit', () => {
            expect(defaultType({ timeUnit: 'month', field: 'a' }, 'x')).toEqual('temporal');
        });
        it('should return quantitative if there is bin', () => {
            expect(defaultType({ bin: true, field: 'a' }, 'x')).toEqual('quantitative');
        });
        it('should return quantitative for a channel that supports measure', () => {
            for (const c of ['x', 'y', 'size', 'opacity', 'order']) {
                expect(defaultType({ field: 'a' }, c)).toEqual('quantitative');
            }
        });
        it('should return nominal for a channel that does not support measure', () => {
            for (const c of ['color', 'shape', 'row', 'column']) {
                expect(defaultType({ field: 'a' }, c)).toEqual('nominal');
            }
        });
    });
    describe('normalize()', () => {
        it('should convert primitive type to value def', log.wrap(localLogger => {
            expect(normalize(5, 'x')).toEqual({ value: 5 });
            expect(localLogger.warns.length).toEqual(1);
        }));
        it('should return fieldDef with full type name.', () => {
            const fieldDef = { field: 'a', type: 'q' };
            expect(normalize(fieldDef, 'x')).toEqual({ field: 'a', type: 'quantitative' });
        });
        it('normalizes yearmonthday to become yearmonthdate.', log.wrap(localLogger => {
            const fieldDef = {
                timeUnit: 'yearmonthday',
                field: 'a',
                type: 'temporal'
            };
            expect(normalize(fieldDef, 'x')).toEqual({
                timeUnit: 'yearmonthdate',
                field: 'a',
                type: 'temporal'
            });
            expect(localLogger.warns[0]).toEqual(log.message.dayReplacedWithDate('yearmonthday'));
        }));
        it('should replace other type with quantitative for a field with counting aggregate.', log.wrap(localLogger => {
            for (const aggregate of COUNTING_OPS) {
                const fieldDef = { aggregate, field: 'a', type: 'nominal' };
                expect(normalize(fieldDef, 'x')).toEqual({ aggregate, field: 'a', type: 'quantitative' });
            }
            expect(localLogger.warns.length).toEqual(4);
        }));
        it('should return fieldDef with default type and throw warning if type is missing.', log.wrap(localLogger => {
            const fieldDef = { field: 'a' };
            expect(normalize(fieldDef, 'x')).toEqual({ field: 'a', type: 'quantitative' });
            expect(localLogger.warns[0]).toEqual(log.message.missingFieldType('x', 'quantitative'));
        }));
        it('should drop invalid aggregate ops and throw warning.', log.wrap(localLogger => {
            const fieldDef = { aggregate: 'boxplot', field: 'a', type: 'quantitative' };
            expect(normalize(fieldDef, 'x')).toEqual({ field: 'a', type: 'quantitative' });
            expect(localLogger.warns[0]).toEqual(log.message.invalidAggregate('boxplot'));
        }));
    });
    describe('channelCompatability', () => {
        describe('row/column', () => {
            it('is incompatible with continuous field', () => {
                for (const channel of ['row', 'column']) {
                    expect(!channelCompatibility({ field: 'a', type: 'quantitative' }, channel).compatible).toBeTruthy();
                }
            });
            it('is compatible with discrete field', () => {
                for (const channel of ['row', 'column']) {
                    expect(channelCompatibility({ field: 'a', type: 'nominal' }, channel).compatible).toBeTruthy();
                }
            });
        });
        describe('x/y/color/text/detail', () => {
            it('is compatible with continuous field', () => {
                for (const channel of ['x', 'y', 'color', 'text', 'detail']) {
                    expect(channelCompatibility({ field: 'a', type: 'quantitative' }, channel).compatible).toBeTruthy();
                }
            });
            it('is compatible with discrete field', () => {
                for (const channel of ['x', 'y', 'color', 'text', 'detail']) {
                    expect(channelCompatibility({ field: 'a', type: 'nominal' }, channel).compatible).toBeTruthy();
                }
            });
        });
        describe('opacity/size/x2/y2', () => {
            it('is compatible with continuous field', () => {
                for (const channel of ['opacity', 'size', 'x2', 'y2']) {
                    expect(channelCompatibility({ field: 'a', type: 'quantitative' }, channel).compatible).toBeTruthy();
                }
            });
            it('is compatible with binned field', () => {
                for (const channel of ['opacity', 'size', 'x2', 'y2']) {
                    expect(channelCompatibility({ bin: true, field: 'a', type: 'quantitative' }, channel).compatible).toBeTruthy();
                }
            });
            it('is incompatible with nominal field', () => {
                for (const channel of ['opacity', 'size', 'x2', 'y2']) {
                    expect(!channelCompatibility({ field: 'a', type: 'nominal' }, channel).compatible).toBeTruthy();
                }
            });
        });
        describe('shape', () => {
            it('is compatible with nominal field', () => {
                expect(channelCompatibility({ field: 'a', type: 'nominal' }, 'shape').compatible).toBeTruthy();
            });
            it('is compatible with ordinal field', () => {
                expect(channelCompatibility({ field: 'a', type: 'ordinal' }, 'shape').compatible).toBeTruthy();
            });
            it('is incompatible with quantitative field', () => {
                expect(!channelCompatibility({ field: 'a', type: 'quantitative' }, 'shape').compatible).toBeTruthy();
            });
            it('is the only channel that is incompatible with geojson field', () => {
                for (const channel of CHANNELS) {
                    expect(channelCompatibility({ field: 'a', type: 'geojson' }, channel).compatible === (channel === 'shape')).toBeTruthy();
                }
            });
        });
        describe('order', () => {
            it('is incompatible with nominal field', () => {
                expect(!channelCompatibility({ field: 'a', type: 'nominal' }, 'order').compatible).toBeTruthy();
            });
            it('is compatible with ordinal field', () => {
                expect(channelCompatibility({ field: 'a', type: 'ordinal' }, 'order').compatible).toBeTruthy();
            });
            it('is compatible with quantitative field', () => {
                expect(channelCompatibility({ field: 'a', type: 'quantitative' }, 'order').compatible).toBeTruthy();
            });
        });
    });
    describe('defaultTitle()', () => {
        it('should return correct title for aggregate', () => {
            expect(defaultTitle({ field: 'f', aggregate: 'mean' }, {})).toEqual('Mean of f');
        });
        it('should return correct title for count', () => {
            expect(defaultTitle({ aggregate: 'count' }, { countTitle: 'baz!' })).toEqual('baz!');
        });
        it('should return correct title for bin', () => {
            const fieldDef = { field: 'f', type: QUANTITATIVE, bin: true };
            expect(defaultTitle(fieldDef, {})).toEqual('f (binned)');
        });
        it('should return correct title for bin', () => {
            const fieldDef = { field: 'f', type: QUANTITATIVE, bin: true };
            expect(defaultTitle(fieldDef, { fieldTitle: 'functional' })).toEqual('BIN(f)');
        });
        it('should return correct title for timeUnit', () => {
            const fieldDef = { field: 'f', type: TEMPORAL, timeUnit: TimeUnit.MONTH };
            expect(defaultTitle(fieldDef, {})).toEqual('f (month)');
        });
        it('should return correct title for timeUnit', () => {
            const fieldDef = { field: 'f', type: TEMPORAL, timeUnit: TimeUnit.YEARMONTHDATE };
            expect(defaultTitle(fieldDef, {})).toEqual('f (year-month-date)');
        });
        it('should return correct title for timeUnit', () => {
            const fieldDef = { field: 'f', type: TEMPORAL, timeUnit: TimeUnit.DAY };
            expect(defaultTitle(fieldDef, {})).toEqual('f (day)');
        });
        it('should return correct title for timeUnit', () => {
            const fieldDef = { field: 'f', type: TEMPORAL, timeUnit: TimeUnit.YEARQUARTER };
            expect(defaultTitle(fieldDef, {})).toEqual('f (year-quarter)');
        });
        it('should return correct title for raw field', () => {
            const fieldDef = { field: 'f', type: TEMPORAL };
            expect(defaultTitle(fieldDef, {})).toEqual('f');
        });
    });
});
//# sourceMappingURL=fielddef.test.js.map