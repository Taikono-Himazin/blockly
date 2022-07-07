/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Zelos specific objects representing inputs with connections on
 * a rendered block.
 */

/**
 * Zelos specific objects representing inputs with connections on
 * a rendered block.
 * @class
 */


/* eslint-disable-next-line no-unused-vars */
import type {Input} from '../../../input';
import {ConstantProvider} from '../../../renderers/common/constants';
import {StatementInput as BaseStatementInput} from '../../../renderers/measurables/statement_input';


/**
 * An object containing information about the space a statement input takes up
 * during rendering.
 * @alias Blockly.zelos.StatementInput
 */
export class StatementInput extends BaseStatementInput {
  connectedBottomNextConnection = false;
  override height: AnyDuringMigration;

  /**
   * @param constants The rendering constants provider.
   * @param input The statement input to measure and store information for.
   * @internal
   */
  constructor(constants: ConstantProvider, input: Input) {
    super(constants, input);

    if (this.connectedBlock) {
      // Find the bottom-most connected block in the stack.
      let block = this.connectedBlock;
      let nextBlock;
      while (nextBlock = block.getNextBlock()) {
        block = nextBlock;
      }
      if (!block.nextConnection) {
        this.height = this.connectedBlockHeight;
        this.connectedBottomNextConnection = true;
      }
    }
  }
}
