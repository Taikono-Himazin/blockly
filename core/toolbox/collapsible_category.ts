/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A toolbox category used to organize blocks in the toolbox.
 */

/**
 * A toolbox category used to organize blocks in the toolbox.
 * @class
 */


import type {ICollapsibleToolboxItem} from '../interfaces/i_collapsible_toolbox_item';
import type {IToolbox} from '../interfaces/i_toolbox';
import type {IToolboxItem} from '../interfaces/i_toolbox_item';
import * as registry from '../registry';
import * as aria from '../utils/aria';
import * as dom from '../utils/dom';
import * as toolbox from '../utils/toolbox';

import {ToolboxCategory} from './category';
import {ToolboxSeparator} from './separator';


/**
 * Class for a category in a toolbox that can be collapsed.
 * @alias Blockly.CollapsibleToolboxCategory
 */
export class CollapsibleToolboxCategory extends ToolboxCategory implements
    ICollapsibleToolboxItem {
  /** Name used for registering a collapsible toolbox category. */
  static override registrationName = 'collapsibleCategory';

  /** Container for any child categories. */
  protected subcategoriesDiv_: HTMLDivElement|null = null;

  /** Whether or not the category should display its subcategories. */
  protected expanded_ = false;

  /** The child toolbox items for this category. */
  protected toolboxItems_: IToolboxItem[] = [];
  override flyoutItems_: AnyDuringMigration;
  override isHidden_: AnyDuringMigration;

  /**
   * @param categoryDef The information needed to create a category in the
   *     toolbox.
   * @param toolbox The parent toolbox for the category.
   * @param opt_parent The parent category or null if the category does not have
   *     a parent.
   */
  constructor(
      categoryDef: toolbox.CategoryInfo, toolbox: IToolbox,
      opt_parent?: ICollapsibleToolboxItem) {
    super(categoryDef, toolbox, opt_parent);
  }

  override makeDefaultCssConfig_() {
    const cssConfig = super.makeDefaultCssConfig_();
    (cssConfig as AnyDuringMigration)['contents'] = 'blocklyToolboxContents';
    return cssConfig;
  }

  override parseContents_(categoryDef: toolbox.CategoryInfo) {
    // AnyDuringMigration because:  Element implicitly has an 'any' type because
    // expression of type '"contents"' can't be used to index type
    // 'CategoryInfo'.
    const contents = (categoryDef as AnyDuringMigration)['contents'];
    let prevIsFlyoutItem = true;

    // AnyDuringMigration because:  Element implicitly has an 'any' type because
    // expression of type '"custom"' can't be used to index type 'CategoryInfo'.
    if ((categoryDef as AnyDuringMigration)['custom']) {
      // AnyDuringMigration because:  Element implicitly has an 'any' type
      // because expression of type '"custom"' can't be used to index type
      // 'CategoryInfo'.
      this.flyoutItems_ = (categoryDef as AnyDuringMigration)['custom'];
    } else if (contents) {
      for (let i = 0; i < contents.length; i++) {
        const itemDef = contents[i];
        // Separators can exist as either a flyout item or a toolbox item so
        // decide where it goes based on the type of the previous item.
        if (!registry.hasItem(registry.Type.TOOLBOX_ITEM, itemDef['kind']) ||
            itemDef['kind'].toLowerCase() ===
                    ToolboxSeparator.registrationName &&
                prevIsFlyoutItem) {
          const flyoutItem = itemDef as toolbox.FlyoutItemInfo;
          this.flyoutItems_.push(flyoutItem);
          prevIsFlyoutItem = true;
        } else {
          this.createToolboxItem_(itemDef);
          prevIsFlyoutItem = false;
        }
      }
    }
  }

  /**
   * Creates a toolbox item and adds it to the list of toolbox items.
   * @param itemDef The information needed to create a toolbox item.
   */
  private createToolboxItem_(itemDef: toolbox.ToolboxItemInfo) {
    let registryName = itemDef['kind'];
    const categoryDef = itemDef as toolbox.CategoryInfo;
    // Categories that are collapsible are created using a class registered
    // under a different name.
    if (registryName.toUpperCase() == 'CATEGORY' &&
        toolbox.isCategoryCollapsible(categoryDef)) {
      registryName = CollapsibleToolboxCategory.registrationName;
    }
    const ToolboxItemClass =
        registry.getClass(registry.Type.TOOLBOX_ITEM, registryName);
    const toolboxItem =
        new ToolboxItemClass!(itemDef, this.parentToolbox_, this);
    this.toolboxItems_.push(toolboxItem);
  }

  override init() {
    super.init();

    this.setExpanded(
        (this.toolboxItemDef_ as AnyDuringMigration)['expanded'] === 'true' ||
        (this.toolboxItemDef_ as AnyDuringMigration)['expanded']);
  }

  override createDom_() {
    super.createDom_();

    const subCategories = this.getChildToolboxItems();
    this.subcategoriesDiv_ = this.createSubCategoriesDom_(subCategories);
    aria.setRole(this.subcategoriesDiv_, aria.Role.GROUP);
    this.htmlDiv_!.appendChild(this.subcategoriesDiv_);

    return this.htmlDiv_!;
  }

  override createIconDom_() {
    const toolboxIcon = document.createElement('span');
    if (!this.parentToolbox_.isHorizontal()) {
      // AnyDuringMigration because:  Argument of type 'string | undefined' is
      // not assignable to parameter of type 'string'.
      dom.addClass(
          toolboxIcon, (this.cssConfig_ as AnyDuringMigration)['icon']);
      toolboxIcon.style.visibility = 'visible';
    }

    toolboxIcon.style.display = 'inline-block';
    return toolboxIcon;
  }

  /**
   * Create the DOM for all subcategories.
   * @param subcategories The subcategories.
   * @return The div holding all the subcategories.
   */
  protected createSubCategoriesDom_(subcategories: IToolboxItem[]):
      HTMLDivElement {
    const contentsContainer = (document.createElement('div'));
    dom.addClass(
        contentsContainer, (this.cssConfig_ as AnyDuringMigration)['contents']);

    for (let i = 0; i < subcategories.length; i++) {
      const newCategory = subcategories[i];
      newCategory.init();
      const newCategoryDiv = newCategory.getDiv();
      contentsContainer.appendChild(newCategoryDiv!);
      if (newCategory.getClickTarget) {
        newCategory.getClickTarget()?.setAttribute('id', newCategory.getId());
      }
    }
    return contentsContainer;
  }

  /**
   * Opens or closes the current category.
   * @param isExpanded True to expand the category, false to close.
   */
  setExpanded(isExpanded: boolean) {
    if (this.expanded_ === isExpanded) {
      return;
    }
    this.expanded_ = isExpanded;
    if (isExpanded) {
      this.subcategoriesDiv_!.style.display = 'block';
      this.openIcon_(this.iconDom_);
    } else {
      this.subcategoriesDiv_!.style.display = 'none';
      this.closeIcon_(this.iconDom_);
    }
    aria.setState(
        this.htmlDiv_ as HTMLDivElement, aria.State.EXPANDED, isExpanded);

    this.parentToolbox_.handleToolboxItemResize();
  }

  override setVisible_(isVisible: boolean) {
    this.htmlDiv_!.style.display = isVisible ? 'block' : 'none';
    const childToolboxItems = this.getChildToolboxItems();
    for (let i = 0; i < childToolboxItems.length; i++) {
      const child = childToolboxItems[i];
      child.setVisible_(isVisible);
    }
    this.isHidden_ = !isVisible;

    if (this.parentToolbox_.getSelectedItem() === this) {
      this.parentToolbox_.clearSelection();
    }
  }

  /**
   * Whether the category is expanded to show its child subcategories.
   * @return True if the toolbox item shows its children, false if it is
   *     collapsed.
   */
  isExpanded(): boolean {
    return this.expanded_;
  }

  override isCollapsible() {
    return true;
  }

  override onClick(_e: Event) {
    this.toggleExpanded();
  }

  /** Toggles whether or not the category is expanded. */
  toggleExpanded() {
    this.setExpanded(!this.expanded_);
  }

  override getDiv() {
    return this.htmlDiv_;
  }

  /**
   * Gets any children toolbox items. (ex. Gets the subcategories)
   * @return The child toolbox items.
   */
  getChildToolboxItems(): IToolboxItem[] {
    return this.toolboxItems_;
  }
}

export namespace CollapsibleToolboxCategory {
  /**
   * All the CSS class names that are used to create a collapsible
   * category. This is all the properties from the regular category plus
   * contents.
   */
  export interface CssConfig {
    container: string|null;
    row: string|null;
    rowcontentcontainer: string|null;
    icon: string|null;
    label: string|null;
    selected: string|null;
    openicon: string|null;
    closedicon: string|null;
    contents: string|null;
  }
}

export type CssConfig = CollapsibleToolboxCategory.CssConfig;

registry.register(
    registry.Type.TOOLBOX_ITEM, CollapsibleToolboxCategory.registrationName,
    CollapsibleToolboxCategory);
