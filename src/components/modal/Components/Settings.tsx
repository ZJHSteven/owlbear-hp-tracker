import {
    dicePlusAvailableKey,
    diceTrayModal,
    diceTrayModalId,
    itemMetadataKey,
    modalId,
} from "../../../helper/variables.ts";
import OBR from "@owlbear-rodeo/sdk";
import { updateHp, updateHpOffset } from "../../../helper/hpHelpers.ts";
import { Groups } from "./Groups.tsx";
import { Switch } from "../../general/Switch/Switch.tsx";
import { dndSvg, pfSvg } from "./SwitchBackground.ts";
import { updateAcOffset } from "../../../helper/acHelper.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { getRoomDiceUser, updateRoomMetadata } from "../../../helper/helpers.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { useShallow } from "zustand/react/shallow";
import { updateList } from "../../../helper/obrHelper.ts";
import { DICE_ROLLER, GMGMetadata } from "../../../helper/types.ts";
import { useLocalStorage } from "../../../helper/hooks.ts";
import Tippy from "@tippyjs/react";

export const Settings = () => {
    const tokens = useTokenListContext(useShallow((state) => state.tokens));
    const [room, scene] = useMetadataContext(useShallow((state) => [state.room, state.scene]));
    const [dicePlusAvailable] = useLocalStorage(dicePlusAvailableKey, false);

    const handleOffsetChange = (value: number) => {
        updateHpOffset(value);
        updateRoomMetadata(room, { hpBarOffset: value });
    };

    const handleAcOffsetChange = (x: number, y: number) => {
        updateAcOffset({ x: x, y: y });
        updateRoomMetadata(room, { acOffset: { x: x, y: y } });
    };

    return (
        <>
            <button className={"close-button"} onClick={async () => await OBR.modal.close(modalId)}>
                X
            </button>
            <div className={"global-setting"}>
                {/* 设置主标题 */}
                <h2>设置</h2>
                <>
                    <div className={"settings-context vertical"}>
                        <h3>房间设置</h3>
                        <span className={"small"}>(对当前房间内的所有场景生效)</span>
                    </div>
                    <div className={"ruleset setting"}>
                        规则集（Statblock 来源）：{" "}
                        <Switch
                            labels={{ left: "DnD", right: "PF" }}
                            onChange={(checked) => {
                                if (checked) {
                                    updateRoomMetadata(room, { ruleset: "pf" });
                                } else {
                                    updateRoomMetadata(room, { ruleset: "e5" });
                                }
                            }}
                            checked={!!room && room.ruleset === "pf"}
                            backgroundImages={{ left: dndSvg, right: pfSvg }}
                        />
                    </div>
                    <div className={"tabletop-almanac setting"}>
                        Tabletop Almanac API Key：
                        <input
                            type={"password"}
                            value={room?.tabletopAlmanacAPIKey || ""}
                            onChange={(e) => {
                                updateRoomMetadata(room, { tabletopAlmanacAPIKey: e.currentTarget.value });
                            }}
                        />
                    </div>
                    <div className={"hp-mode setting-group vertical"}>
                        <div>
                            HP 条分段：{" "}
                            <input
                                type={"text"}
                                size={2}
                                value={room?.hpBarSegments || 0}
                                onChange={(e) => {
                                    const nValue = Number(e.target.value.replace(/[^0-9]/g, ""));
                                    updateRoomMetadata(room, { hpBarSegments: nValue });
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowUp") {
                                        updateRoomMetadata(room, { hpBarSegments: (room?.hpBarSegments || 0) + 1 });
                                    } else if (e.key === "ArrowDown") {
                                        updateRoomMetadata(room, { hpBarSegments: (room?.hpBarSegments || 0) + -1 });
                                    }
                                }}
                            />
                        </div>
                        <div>
                            关闭 HP 条：
                            <input
                                type={"checkbox"}
                                checked={!!room?.disableHpBar}
                                onChange={async () => {
                                    const hpBarDisabled = !room?.disableHpBar;
                                    await updateRoomMetadata(room, {
                                        disableHpBar: hpBarDisabled,
                                    });
                                    const items = tokens ? [...tokens].map((t) => t[1].item) : [];
                                    await updateList(items, hpBarDisabled ? 4 : 2, async (subList) => {
                                        for (const item of subList) {
                                            const data = item.metadata[itemMetadataKey] as GMGMetadata;
                                            await updateHp(item, {
                                                ...data,
                                                hpBar: data.hpOnMap && !hpBarDisabled,
                                            });
                                        }
                                    });
                                }}
                            />
                        </div>
                        <div>
                            玩家端禁用颜色渐变：
                            <input
                                type={"checkbox"}
                                checked={!!room?.disableColorGradient}
                                onChange={async () => {
                                    await updateRoomMetadata(room, {
                                        disableColorGradient: !room?.disableColorGradient,
                                    });
                                }}
                            />
                        </div>
                    </div>
                    <div className={"setting-group vertical"}>
                        <div className={"hp-position setting"}>
                            HP 文本/条偏移：{" "}
                            <input
                                type={"number"}
                                size={2}
                                defaultValue={room?.hpBarOffset || 0}
                                onChange={(e) => {
                                    handleOffsetChange(Number(e.currentTarget.value));
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowUp") {
                                        handleOffsetChange((room?.hpBarOffset || 0) + 1);
                                        e.currentTarget.value = String((room?.hpBarOffset || 0) + 1);
                                    } else if (e.key === "ArrowDown") {
                                        handleOffsetChange((room?.hpBarOffset || 0) - 1);
                                        e.currentTarget.value = String((room?.hpBarOffset || 0) + 1);
                                    }
                                }}
                            />
                        </div>
                        <div className={"ac setting"}>
                            AC 盾牌偏移：
                            <div>
                                X{" "}
                                <input
                                    type={"number"}
                                    size={2}
                                    value={room?.acOffset?.x || 0}
                                    onChange={(e) => {
                                        handleAcOffsetChange(Number(e.currentTarget.value), room?.acOffset?.y || 0);
                                    }}
                                />
                                Y{" "}
                                <input
                                    type={"number"}
                                    size={2}
                                    value={room?.acOffset?.y || 0}
                                    onChange={(e) => {
                                        handleAcOffsetChange(room?.acOffset?.x || 0, Number(e.currentTarget.value));
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={"dice-roller-enabled setting-group vertical"}>
                        <div className={"setting"}>
                            选择骰子方案：
                            <select
                                value={room?.diceRoller || DICE_ROLLER.DDDICE}
                                onChange={async (e) => {
                                    const diceRoller = Number(e.currentTarget.value) as DICE_ROLLER;
                                    await updateRoomMetadata(room, { diceRoller });
                                    if (diceRoller === DICE_ROLLER.DDDICE) {
                                        const diceRoomUser = getRoomDiceUser(room, OBR.player.id);
                                        if (diceRoomUser) {
                                            await OBR.modal.open({
                                                ...diceTrayModal,
                                                url: `https://dddice.com/room/${room?.diceRoom!.slug}/stream?key=${
                                                    diceRoomUser.apiKey
                                                }`,
                                            });
                                        }
                                    } else {
                                        await OBR.modal.close(diceTrayModalId);
                                    }
                                }}
                            >
                                <option value={DICE_ROLLER.DDDICE}>dddice</option>
                                <option value={DICE_ROLLER.SIMPLE}>本地计算</option>
                                {dicePlusAvailable ? <option value={DICE_ROLLER.DICE_PLUS}>Dice+</option> : null}
                            </select>
                        </div>
                        {!dicePlusAvailable ? (
                            <div
                                style={{
                                    justifyContent: "flex-start",
                                    gap: "1ch",
                                    fontSize: "0.8rem",
                                    // alignItems: "flex-end",
                                }}
                                className={"setting"}
                            >
                                安装{" "}
                                <Tippy content={"将 Dice+ 安装到房间后需刷新页面才能在下拉框中选择"}>
                                    <a
                                        style={{ fontWeight: "600", fontSize: "1rem" }}
                                        href={
                                            "https://owlbear.rogue.pub/extension/https://dice-plus.missinglinkdev.com/manifest.json"
                                        }
                                        target={"_blank"}
                                    >
                                        Dice+
                                    </a>
                                </Tippy>{" "}
                                可获得 OBR 原生 3D 骰子
                            </div>
                        ) : null}
                    </div>
                    <div className={"negative-numbers setting"}>
                        允许 HP/AC 为负：
                        <input
                            type={"checkbox"}
                            checked={room?.allowNegativeNumbers || false}
                            onChange={() => {
                                updateRoomMetadata(room, { allowNegativeNumbers: !room?.allowNegativeNumbers });
                            }}
                        />
                    </div>
                    <div className={"auto-limit setting"}>
                        禁用基于公式的自动次数重置：
                        <input
                            type={"checkbox"}
                            checked={room?.disableLimitRolls || false}
                            onChange={() => {
                                updateRoomMetadata(room, { disableLimitRolls: !room?.disableLimitRolls });
                            }}
                        />
                    </div>
                    <div className={"player-sort setting"}>
                        玩家端按先攻排序 Token：
                        <input
                            type={"checkbox"}
                            checked={room?.playerSort || false}
                            onChange={() => {
                                updateRoomMetadata(room, { playerSort: !room?.playerSort });
                            }}
                        />
                    </div>
                    <div className={"initiative-dice setting"}>
                        先攻骰面数：
                        <input
                            type={"number"}
                            size={1}
                            value={room?.initiativeDice || 20}
                            onChange={(e) => {
                                updateRoomMetadata(room, { initiativeDice: parseInt(e.target.value) });
                            }}
                        />
                    </div>
                    <div className={"statblock-popover setting-group vertical"}>
                        <div className={"settings-context vertical"}>
                            <h4>Statblock 弹窗尺寸</h4>
                            <span className={"small"}>(不可超过当前视窗大小)</span>
                        </div>
                        <label>
                            宽度{" "}
                            <input
                                type={"number"}
                                defaultValue={room?.statblockPopover?.width || 500}
                                onBlur={(e) => {
                                    updateRoomMetadata(room, {
                                        statblockPopover: {
                                            height: room?.statblockPopover?.height || 600,
                                            width: Math.max(parseInt(e.currentTarget.value), 200),
                                        },
                                    });

                                    e.currentTarget.value = String(Math.max(200, parseInt(e.currentTarget.value)));
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        updateRoomMetadata(room, {
                                            statblockPopover: {
                                                height: room?.statblockPopover?.height || 600,
                                                width: Math.max(parseInt(e.currentTarget.value), 200),
                                            },
                                        });
                                        e.currentTarget.value = String(Math.max(200, parseInt(e.currentTarget.value)));
                                    }
                                }}
                            />
                        </label>
                        <label>
                            高度{" "}
                            <input
                                type={"number"}
                                defaultValue={room?.statblockPopover?.height || 600}
                                onBlur={(e) => {
                                    updateRoomMetadata(room, {
                                        statblockPopover: {
                                            width: room?.statblockPopover?.width || 500,
                                            height: Math.max(parseInt(e.currentTarget.value), 200),
                                        },
                                    });
                                    e.currentTarget.value = String(Math.max(200, parseInt(e.target.value)));
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        updateRoomMetadata(room, {
                                            statblockPopover: {
                                                width: room?.statblockPopover?.width || 500,
                                                height: Math.max(parseInt(e.currentTarget.value), 200),
                                            },
                                        });
                                        e.currentTarget.value = String(Math.max(200, parseInt(e.currentTarget.value)));
                                    }
                                }}
                            />
                        </label>
                    </div>
                    <div className={"update-notification setting"}>
                        更新后不自动弹出更新日志：
                        <input
                            type={"checkbox"}
                            checked={room?.ignoreUpdateNotification || false}
                            onChange={() => {
                                updateRoomMetadata(room, { ignoreUpdateNotification: !room?.ignoreUpdateNotification });
                            }}
                        />
                    </div>
                    <div className={"settings-context vertical"}>
                        <h3>场景设置</h3>
                        <span className={"small"}>(仅影响当前场景)</span>
                    </div>
                    {scene ? (
                        <Groups />
                    ) : (
                        <span className={"warning"}>需打开场景后才可配置场景设置</span>
                    )}
                </>
            </div>
        </>
    );
};
