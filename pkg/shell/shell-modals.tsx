/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2020 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <https://www.gnu.org/licenses/>.
 */

import cockpit from "cockpit";
import React, { useState } from "react";
import { AboutModal } from "@patternfly/react-core/dist/esm/components/AboutModal/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Divider } from "@patternfly/react-core/dist/esm/components/Divider/index.js";
import { Flex } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";
import { Menu, MenuContent, MenuSearch, MenuSearchInput, MenuItem, MenuList } from "@patternfly/react-core/dist/esm/components/Menu/index.js";
import {
    Modal, ModalBody, ModalFooter, ModalHeader
} from '@patternfly/react-core/dist/esm/components/Modal/index.js';
import { TextInput } from "@patternfly/react-core/dist/esm/components/TextInput/index.js";
import { Content, ContentVariants } from "@patternfly/react-core/dist/esm/components/Content/index.js";
import { SearchIcon } from '@patternfly/react-icons';

import { useInit } from "hooks";
import { DialogResult } from "dialogs";

import { ShellState } from "./state";

import "menu-select-widget.scss";

const _ = cockpit.gettext;

interface Package {
    name: string;
    version: string;
}

export const AboutCockpitModal = ({
    dialogResult
} : {
    dialogResult: DialogResult<void>
}) => {
    const [packages, setPackages] = useState<Package[]>([]);

    useInit(() => {
        const packages: Package[] = [];
        const cmd = "(set +e; rpm -qa --qf '%{NAME} %{VERSION}\\n'; dpkg-query -f '${Package} ${Version}\n' --show; pacman -Q) 2> /dev/null | grep cockpit | sort";
        cockpit.spawn(["bash", "-c", cmd], { err: "message" })
                .then(pkgs =>
                    pkgs.trim().split("\n")
                            .forEach(p => {
                                const parts = p.split(" ");
                                packages.push({ name: parts[0], version: parts[1] });
                            })
                )
                .catch(error => console.error("Could not read packages versions:", error))
                .finally(() => setPackages(packages));
    });

    return (
        <AboutModal
            isOpen
            onClose={() => dialogResult.resolve()}
            id="about-cockpit-modal"
            aria-label="About Cockpit and its versions"
            trademark={_("Licensed under GNU LGPL version 2.1")}
            productName={_("Web Console")}
            brandImageSrc="../shell/images/cockpit-icon-gray.svg"
            brandImageAlt={_("Web console logo")}
        >
            <Content component={ContentVariants.p}>
                {_("Cockpit is an interactive Linux server admin interface.")}
            </Content>
            <Content component={ContentVariants.p}>
                <Content component={ContentVariants.a} href="https://cockpit-project.org" target="_blank" rel="noopener noreferrer">
                    {_("Project website")}
                </Content>
            </Content>
            <Content component="dl">
                {packages === null && <span>{_("Loading packages...")}</span>}
                {packages !== null && packages.map(p =>
                    <React.Fragment key={p.name}>
                        <Content key={p.name} component="dt">{p.name}</Content>
                        <Content component="dd">{p.version}</Content>
                    </React.Fragment>
                )}
            </Content>
        </AboutModal>
    );
};

export interface LangModalProps {
    dialogResult: DialogResult<void>;
    state: ShellState;
}

export const LangModal = ({
    dialogResult,
    state
}: LangModalProps) => {
    const language = document.cookie.replace(/(?:(?:^|.*;\s*)CockpitLang\s*=\s*([^;]*).*$)|^.*$/, "$1") || "en-us";

    const [selected, setSelected] = useState(language);
    const [searchInput, setSearchInput] = useState("");

    function onSelect() {
        if (!selected)
            return;

        const cookie = "CockpitLang=" + encodeURIComponent(selected) + "; path=/; expires=Sun, 16 Jul 3567 06:23:41 GMT";
        document.cookie = cookie;
        window.localStorage.setItem("cockpit.lang", selected);
        window.location.reload();
    }

    return (
        <Modal isOpen position="top" variant="small"
               id="display-language-modal"
               className="display-language-modal"
               onClose={() => dialogResult.resolve()}
        >
            <ModalHeader title={_("Display language")} />
            <ModalBody>
                <Flex direction={{ default: 'column' }}>
                    <p>{_("Choose the language to be used in the application")}</p>
                    <Menu id="display-language-list"
                          isPlain
                          isScrollable
                          className="ct-menu-select-widget"
                          onSelect={(_, selected) => setSelected(selected as string)}
                          activeItemId={selected}
                          selected={selected}>
                        <MenuSearch>
                            <MenuSearchInput>
                                <TextInput
                                    value={searchInput}
                                    aria-label={_("Filter menu items")}
                                    customIcon={<SearchIcon />}
                                    type="search"
                                    onChange={(_event, value) => setSearchInput(value)}
                                />
                            </MenuSearchInput>
                        </MenuSearch>
                        <Divider />
                        <MenuContent>
                            <MenuList>
                                {
                                    (() => {
                                        const locales = state.config.manifest.locales || {};
                                        const filteredLocales = Object.keys(locales)
                                                .filter(key => !searchInput || locales[key].toLowerCase().includes(searchInput.toString().toLowerCase()));

                                        if (filteredLocales.length === 0) {
                                            return (
                                                <MenuItem isDisabled>
                                                    {_("No languages match")}
                                                </MenuItem>
                                            );
                                        }
                                        return filteredLocales.map(key => {
                                            return (
                                                <MenuItem itemId={key} key={key} data-value={key}>
                                                    {locales[key]}
                                                </MenuItem>
                                            );
                                        });
                                    })()
                                }
                            </MenuList>
                        </MenuContent>
                    </Menu>
                </Flex>
            </ModalBody>
            <ModalFooter>
                <Button variant='primary' onClick={onSelect}>{_("Select")}</Button>
                <Button variant='link' onClick={() => dialogResult.resolve()}>{_("Cancel")}</Button>
            </ModalFooter>
        </Modal>
    );
};

export interface OopsModalProps {
    dialogResult: DialogResult<void>;
}

export function OopsModal({ dialogResult }: OopsModalProps) {
    return (
        <Modal isOpen position="top" variant="medium"
               onClose={() => dialogResult.resolve()}
        >
            <ModalHeader title={_("Unexpected error")} />
            <ModalBody>
                {_("Cockpit had an unexpected internal error.")}
                <br />
                <br />
                <span>{("You can try restarting Cockpit by pressing refresh in your browser. The javascript console contains details about this error") + " ("}
                    <b>{_("Ctrl-Shift-I")}</b>
                    {" " + _("in most browsers") + ")."}
                </span>
            </ModalBody>
            <ModalFooter>
                <Button variant='secondary' onClick={() => dialogResult.resolve()}>{_("Close")}</Button>
            </ModalFooter>
        </Modal>
    );
}
