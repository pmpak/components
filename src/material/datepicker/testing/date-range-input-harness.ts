/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {HarnessPredicate, parallel, TestKey} from '@angular/cdk/testing';
import {MatDatepickerInputHarnessBase, getInputPredicate} from './datepicker-input-harness-base';
import {DatepickerTriggerHarnessBase} from './datepicker-trigger-harness-base';
import {
  DatepickerInputHarnessFilters,
  DateRangeInputHarnessFilters,
} from './datepicker-harness-filters';

/** Harness for interacting with a standard Material date range start input in tests. */
export class MatStartDateHarness extends MatDatepickerInputHarnessBase {
  static hostSelector = '.mat-start-date';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatStartDateHarness`
   * that meets certain criteria.
   * @param options Options for filtering which input instances are considered a match.
   * @return a `HarnessPredicate` configured with the given options.
   */
  static with(options: DatepickerInputHarnessFilters = {}): HarnessPredicate<MatStartDateHarness> {
    return getInputPredicate(MatStartDateHarness, options);
  }
}

/** Harness for interacting with a standard Material date range end input in tests. */
export class MatEndDateHarness extends MatDatepickerInputHarnessBase {
  static hostSelector = '.mat-end-date';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatEndDateHarness`
   * that meets certain criteria.
   * @param options Options for filtering which input instances are considered a match.
   * @return a `HarnessPredicate` configured with the given options.
   */
  static with(options: DatepickerInputHarnessFilters = {}): HarnessPredicate<MatEndDateHarness> {
    return getInputPredicate(MatEndDateHarness, options);
  }
}

/** Harness for interacting with a standard Material date range input in tests. */
export class MatDateRangeInputHarness extends DatepickerTriggerHarnessBase {
  static hostSelector = '.mat-date-range-input';

  private readonly _floatingLabelSelector = '.mdc-floating-label';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatDateRangeInputHarness`
   * that meets certain criteria.
   * @param options Options for filtering which input instances are considered a match.
   * @return a `HarnessPredicate` configured with the given options.
   */
  static with(
    options: DateRangeInputHarnessFilters = {},
  ): HarnessPredicate<MatDateRangeInputHarness> {
    return new HarnessPredicate(MatDateRangeInputHarness, options)
      .addOption('value', options.value, (harness, value) =>
        HarnessPredicate.stringMatches(harness.getValue(), value),
      )
      .addOption('label', options.label, (harness, label) => {
        return HarnessPredicate.stringMatches(harness.getLabel(), label);
      });
  }

  /** Gets the combined value of the start and end inputs, including the separator. */
  async getValue(): Promise<string> {
    const [start, end, separator] = await parallel(() => [
      this.getStartInput().then(input => input.getValue()),
      this.getEndInput().then(input => input.getValue()),
      this.getSeparator(),
    ]);

    return start + `${end ? ` ${separator} ${end}` : ''}`;
  }

  /** Gets the inner start date input inside the range input. */
  async getStartInput(): Promise<MatStartDateHarness> {
    // Don't pass in filters here since the start input is required and there can only be one.
    return this.locatorFor(MatStartDateHarness)();
  }

  /** Gets the inner start date input inside the range input. */
  async getEndInput(): Promise<MatEndDateHarness> {
    // Don't pass in filters here since the end input is required and there can only be one.
    return this.locatorFor(MatEndDateHarness)();
  }

  /** Gets the floating label text for the range input, if it exists. */
  async getLabel(): Promise<string | null> {
    // Copied from MatFormFieldControlHarnessBase since this class cannot extend two classes
    const documentRootLocator = this.documentRootLocatorFactory();
    const labelId = await (await this.host()).getAttribute('aria-labelledby');
    const hostId = await (await this.host()).getAttribute('id');

    if (labelId) {
      // First option, try to fetch the label using the `aria-labelledby`
      // attribute.
      const labelEl = await documentRootLocator.locatorForOptional(
        `${this._floatingLabelSelector}[id="${labelId}"]`,
      )();
      return labelEl ? labelEl.text() : null;
    } else if (hostId) {
      // Fallback option, try to match the id of the input with the `for`
      // attribute of the label.
      const labelEl = await documentRootLocator.locatorForOptional(
        `${this._floatingLabelSelector}[for="${hostId}"]`,
      )();
      return labelEl ? labelEl.text() : null;
    }
    return null;
  }

  /** Gets the separator text between the values of the two inputs. */
  async getSeparator(): Promise<string> {
    return (await this.locatorFor('.mat-date-range-input-separator')()).text();
  }

  /** Gets whether the range input is disabled. */
  async isDisabled(): Promise<boolean> {
    // We consider the input as disabled if both of the sub-inputs are disabled.
    const [startDisabled, endDisabled] = await parallel(() => [
      this.getStartInput().then(input => input.isDisabled()),
      this.getEndInput().then(input => input.isDisabled()),
    ]);

    return startDisabled && endDisabled;
  }

  /** Gets whether the range input is required. */
  async isRequired(): Promise<boolean> {
    return (await this.host()).hasClass('mat-date-range-input-required');
  }

  /** Opens the calendar associated with the input. */
  async isCalendarOpen(): Promise<boolean> {
    // `aria-owns` is set on both inputs only if there's an
    // open range picker so we can use it as an indicator.
    const startHost = await (await this.getStartInput()).host();
    return (await startHost.getAttribute('aria-owns')) != null;
  }

  protected async _openCalendar(): Promise<void> {
    // Alt + down arrow is the combination for opening the calendar with the keyboard.
    const startHost = await (await this.getStartInput()).host();
    return startHost.sendKeys({alt: true}, TestKey.DOWN_ARROW);
  }
}
