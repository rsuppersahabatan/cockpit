import cockpit from "cockpit";
import QUnit, { f } from "qunit-tests";

QUnit.test("format", function (assert) {
    assert.equal(cockpit.format("My $adj message with ${amount} of things", { adj: "special", amount: "lots" }),
                 "My special message with lots of things", "named keys");
    assert.equal(cockpit.format("My $0 message with $1 of things", ["special", "lots"]),
                 "My special message with lots of things", "number keys");
    assert.equal(cockpit.format("My $0 message with $1 of things", "special", "lots"),
                 "My special message with lots of things", "vararg keys");
    assert.equal(cockpit.format("My $0 message with lots of things", "special"),
                 "My special message with lots of things", "vararg one key");
    assert.equal(cockpit.format("Undefined $value", { }), "Undefined ", "missing value");

    /* All falsy values except `0` should return the empty string */
    assert.equal(cockpit.format("$0", 0), "0", "`0` as argument");
    assert.equal(cockpit.format("$0", 0.0), "0", "`0.0` as argument");
    assert.equal(cockpit.format("$0", false), "", "`false` as argument");
    assert.equal(cockpit.format("$0", null), "", "`null` as argument");
});

QUnit.test("format_number", function (assert) {
    const checks = [
        [23.4, "23.4", "23,4"],
        [23.46, "23.5", "23,5"],
        [23.44, "23.4", "23,4"],

        [-23.4, "-23.4", "-23,4"],
        [-23.46, "-23.5", "-23,5"],
        [-23.44, "-23.4", "-23,4"],

        [0, "0", "0"],
        [0.001, "0.001", "0,001"],
        [-0.001, "-0.001", "-0,001"],
        // smaller values get rounded up
        [0.0003, "0.001", "0,001"],
        [-0.0003, "-0.001", "-0,001"],

        [123.0, "123", "123"],
        [123.01, "123", "123"],
        [-123.0, "-123", "-123"],
        [-123.01, "-123", "-123"],
        [null, "", ""],
        [undefined, "", ""],
    ] as const;

    const saved_language = cockpit.language;

    assert.expect(checks.length * 3 + 7);

    cockpit.language = 'en';
    for (let i = 0; i < checks.length; i++) {
        assert.strictEqual(cockpit.format_number(checks[i][0]), checks[i][1],
                           f`format_number@en(${checks[i][0]})`
        );
    }

    cockpit.language = 'de';
    for (let i = 0; i < checks.length; i++) {
        assert.strictEqual(cockpit.format_number(checks[i][0]), checks[i][2],
                           f`format_number@de(${checks[i][0]})`
        );
    }

    cockpit.language = 'pt_BR';
    for (let i = 0; i < checks.length; i++) {
        assert.strictEqual(cockpit.format_number(checks[i][0]), checks[i][2],
                           f`format_number@pt_BR(${checks[i][0]})`
        );
    }

    /* restore this as not to break the other tests */
    cockpit.language = saved_language;

    // custom precision
    assert.strictEqual(cockpit.format_number(1.23456, 2), "1.2", "format_number@en(precision 2)");
    assert.strictEqual(cockpit.format_number(-1.23456, 2), "-1.2", "format_number@en(negative, precision 2)");
    assert.strictEqual(cockpit.format_number(0.23456, 2), "0.23", "format_number@en(precision 2)");
    assert.strictEqual(cockpit.format_number(1.23456, 4), "1.235", "format_number@en(precision 4)");
    assert.strictEqual(cockpit.format_number(0.23456, 4), "0.2346", "format_number@en(precision 4)");
    assert.strictEqual(cockpit.format_number(0.000123, 2), "0.01", "format_number@en(very small, precision 2)");
    assert.strictEqual(cockpit.format_number(-0.000123, 2), "-0.01", "format_number@en(negative, very small, precision 2)");
});

QUnit.test("format_bytes", function (assert) {
    const checks = [
        [0, undefined, "0 B"],
        [0, 1000, "0 B"],
        [0, 1024, "0 B"],
        [5, 1000, "5 B"],
        [5, 1024, "5 B"],
        [999, 1000, "999 B"],
        [999, 1024, "999 B"],
        [1023, 1024, "1023 B"],
        [1934, undefined, "1.93 kB"],
        [1934, 1000, "1.93 kB"],
        [2000, 1024, "1.95 KiB"],
        [1999, 1000, "2.00 kB"],
        [1999, 1024, "1.95 KiB"],
        [1000000, 1000, "1 MB"],
        [1000001, 1000, "1.00 MB"],
        [1000000, 1024, "977 KiB"],
        [2000000, 1024, "1.91 MiB"],
        [2000000, 1000, "2 MB"],
        [2000001, 1000, "2.00 MB"],
        [2000000, "MB", "2 MB"],
        [2000000, "MiB", "1.91 MiB"],
        [2000000, "kB", "2000 kB"],
        [2000000, "KiB", "1953 KiB"],
        [1, "kB", "0.001 kB"],
        [0, "kB", "0 kB"],
        [undefined, "kB", ""],
        [null, "kB", ""],
    ] as const;

    for (let i = 0; i < checks.length; i++) {
        if (typeof checks[i][1] === 'string') {
            // these tests are for backwards compatibility only
            continue;
        }

        const base2 = checks[i][1] == 1024;
        assert.strictEqual(cockpit.format_bytes(checks[i][0], { base2 }), checks[i][2],
                           f`format_bytes(${checks[i][0]}, ${{ base2 }})`);
    }

    // old API style (deprecated)
    for (let i = 0; i < checks.length; i++) {
        assert.strictEqual(cockpit.format_bytes(checks[i][0], checks[i][1]), checks[i][2],
                           f`format_bytes(${checks[i][0]}, ${checks[i][1]})`
        );
    }
    for (let i = 0; i < checks.length; i++) {
        const split = checks[i][2].split(" ");
        assert.deepEqual(cockpit.format_bytes(checks[i][0], checks[i][1], { separate: true }), split,
                         f`format_bytes(${checks[i][0]}, ${checks[i][1]}, ${{ separate: true }})`
        );
    }

    // backwards compatible API: format_bytes with a boolean options (used to be a single "separate" flag)
    assert.strictEqual(cockpit.format_bytes(2500000, 1000, false), "2.50 MB");
    assert.deepEqual(cockpit.format_bytes(2500000, 1000, true), ["2.50", "MB"]);
});

QUnit.test("format_bytes_per_sec", function (assert) {
    const checks = [
        // default unit
        [0, undefined, undefined, "0 B/s"],
        [5, undefined, undefined, "5 B/s"],
        [2555, undefined, undefined, "2.56 kB/s"],
        [12345678, undefined, undefined, "12.3 MB/s"],
        // explicit base-2 unit
        [0, 1024, undefined, "0 B/s"],
        [2555, 1024, undefined, "2.50 KiB/s"],
        // explicit base-10 unit
        [0, 1000, undefined, "0 B/s"],
        [2555, 1000, undefined, "2.56 kB/s"],
        [12345678, 1000, undefined, "12.3 MB/s"],
        // explicit unit
        [12345678, "kB/s", undefined, "12346 kB/s"],
        [12345678, "MiB/s", undefined, "11.8 MiB/s"],
        // custom precision
        [2555, 1000, { precision: 2 }, "2.6 kB/s"],
        [25555, "MB/s", { precision: 2 }, "0.026 MB/s"],
        // significant integer digits exceed custom precision
        [25555000, "kB/s", { precision: 2 }, "25555 kB/s"],
        [25555678, "kB/s", { precision: 2 }, "25556 kB/s"],
    ] as const;

    for (let i = 0; i < checks.length; i++) {
        if (typeof checks[i][1] === 'string') {
            // these tests are for backwards compatibility only
            continue;
        }

        const base2 = checks[i][1] == 1024;
        assert.strictEqual(cockpit.format_bytes_per_sec(checks[i][0], { base2, ...checks[i][2] }), checks[i][3],
                           f`format_bytes_per_sec(${checks[i][0]}, ${{ base2, ...checks[i][2] }})`);
    }

    // old API style (deprecated)
    for (let i = 0; i < checks.length; i++) {
        assert.strictEqual(cockpit.format_bytes_per_sec(checks[i][0], checks[i][1], checks[i][2]), checks[i][3],
                           f`format_bytes_per_sec(${checks[i][0]}, ${checks[i][1]}, ${checks[i][2]})`);
    }
    // separate unit (very deprecated)
    assert.deepEqual(cockpit.format_bytes_per_sec(2555, 1024, { separate: true }),
                     ["2.50", "KiB/s"]);
    // backwards compatible API for separate flag (oh so very deprecated)
    assert.deepEqual(cockpit.format_bytes_per_sec(2555, 1024, true),
                     ["2.50", "KiB/s"]);
});

QUnit.test("format_bits_per_sec", function (assert) {
    const checks = [
        [55, "55 bps"],
        [55.23456789, "55.2 bps"],
        [55.98765432, "56.0 bps"],
        [2555, "2.56 Kbps"],
        [2000, "2 Kbps"],
        [2003, "2.00 Kbps"]
    ] as const;

    assert.expect(checks.length);
    for (let i = 0; i < checks.length; i++) {
        assert.strictEqual(cockpit.format_bits_per_sec(checks[i][0]), checks[i][1],
                           f`format_bits_per_sec(${checks[i][0]})`);
    }
});

QUnit.start();
