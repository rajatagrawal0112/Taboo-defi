import { Card, CardHeader, Search } from './components'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Header, KashiLending, LiquidityPosition } from './components/Farms'
import React, { useEffect, useState } from 'react'
// import { formattedNum, formattedPercent } from '../../utils'
import { useFuse, useSortableData } from 'hooks'
import { useMasterChefContract, useMiniChefV2Contract } from '../../hooks/useContract'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'

import { ChainId } from 'quest-taboo-sdk'
import { SimpleDots as Dots } from 'kashi/components'
import { Helmet } from 'react-helmet'
import Menu from './Menu'
import { RowBetween } from '../../components/Row'
import _ from 'lodash'
import styled from 'styled-components'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from 'hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import useMasterChefFarms from './hooks/masterchefv1/useFarms'
import useMasterChefV2Farms from './hooks/masterchefv2/useFarms'
import useMiniChefFarms from './hooks/minichef/useFarms'
import useStakedPending from './hooks/portfolio/useStakedPending'
import { useContext, useMemo } from 'react'

import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { usePairs } from '../../data/Reserves'


import { formattedNum, isAddressString, isWETH } from 'utils'   // for token balances
// useMasterCHef imports
import { ethers } from 'ethers'
import { useCallback } from 'react'
import { useTransactionAdder } from '../../state/transactions/hooks'

export const FixedHeightRow = styled(RowBetween)`
    height: 24px;
`

export default function Yield(): JSX.Element {
    const { i18n } = useLingui()
    const [section, setSection] = useState<'portfolio' | 'all' | 'kmp' | 'slp' | 'mcv2'>('all')
    const { account, chainId } = useActiveWeb3React()

    // Get Farms
    const masterchefv1 = useMasterChefFarms()
    const masterchefv2 = useMasterChefV2Farms()
    const minichef = useMiniChefFarms()
    const allFarms = _.concat(
        masterchefv2 ? masterchefv2 : [],
        minichef ? minichef : [],
        masterchefv1 ? masterchefv1 : []
    ) 

    const trackedTokenPairs = useTrackedTokenPairs()    // It's an object of objects
    const val=Object.values(trackedTokenPairs);
    const v= Object.values(val);

    const pairs= useMemo(
        ()=>v.map(tokens=>({tokens})),
        [v]
    )    
    const tokenPairsWithLiquidityTokens = useMemo(
        () => v.map(tokens => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
        [v]
    )
    // console.log("all pairs",tokenPairsWithLiquidityTokens);

    const allPairs = usePairs(pairs.map(({ tokens }) => tokens))
    // console.log("All Pairs ",allPairs);
    
    const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map(tpwlt => tpwlt.liquidityToken), [
        tokenPairsWithLiquidityTokens
    ])
    const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
        account ?? undefined,
        liquidityTokens
    )

    // fetch the reserves for all V2 pools in which the user has a balance
    const liquidityTokensWithBalances = useMemo(
        () =>
            tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
                v2PairsBalances[liquidityToken.address]
            ),
        [tokenPairsWithLiquidityTokens, v2PairsBalances]
    )
    console.log("liquidity Tokens with balance..............",liquidityTokensWithBalances);
    
    const liquidityTokensWithBalances_= liquidityTokensWithBalances.filter((data:any)=>{
        return data.liquidityToken.address== "0xc030de64a548c7353ca493dd6dba84843a7c11e2";
    })

    const masterChefContract = useMasterChefContract() // withSigner 
    // number of farms
    async function poolLen(){
        let len= await masterChefContract?.poolLength();
        return parseInt(len._hex)
    }

    // creating an object map for farms
    const getPools= async (liquidityTokensWithBalances:any)=>{
        let len= await poolLen();
        let _data:any[]= [];
        const newData= liquidityTokensWithBalances.filter(async (data:any)=>{
            for(let i=0;i<len;i++){
                let addr=  await  masterChefContract?.lpToken(i); 
                if(data.liquidityToken.address==addr) _data.push(data);
            } 
        })
        

        _data.map((data:any)=>{
            return {
                ...data,
                symbol:data.tokens[0].symbol + '-' + data.tokens[1].symbol,
                name: data.tokens[0].name + '-' + data.tokens[1].name,
                // pid: Number(pool.id),
                pairAddress: data.liquidityToken.address,
                // slpBalance: pool.balance,
                // sushiRewardPerDay: rewardPerDay,
                // liquidityPair: pair,
                // roiPerBlock,
                // roiPerHour,
                // roiPerDay,
                // roiPerMonth,
                // roiPerYear,
                // rewardPerThousand: 1 * roiPerDay * (1000 / sushiPrice),
                // tvl: liquidityPosition?.liquidityTokenBalance
                //     ? (pair.reserveUSD / pair.totalSupply) * liquidityPosition.liquidityTokenBalance
                //     : 0.1
            }
        })
        console.log("Promise",_data);
        
        return _data;
    }

    async function m(){
        const data= await getPools(liquidityTokensWithBalances);
        console.log("data with promise", data)
        const newData_= data.map((_data:any)=>{
            console.log("data", _data.liquidityToken.address);
            return {
                ..._data,
                symbol:_data.tokens[0].symbol + '-' + _data.tokens[1].symbol,
                name: _data.tokens[0].name + '-' + _data.tokens[1].name,
                // pid: Number(pool.id),
                pairAddress: _data.liquidityToken.address,
                // slpBalance: pool.balance,
                // sushiRewardPerDay: rewardPerDay,
                // liquidityPair: pair,
                // roiPerBlock,
                // roiPerHour,
                // roiPerDay,
                // roiPerMonth,
                // roiPerYear,
                // rewardPerThousand: 1 * roiPerDay * (1000 / sushiPrice),
                // tvl: liquidityPosition?.liquidityTokenBalance
                //     ? (pair.reserveUSD / pair.totalSupply) * liquidityPosition.liquidityTokenBalance
                //     : 0.1
            }
        })
        return newData_;
    }
    async function c(){
        const d= await m();
        console.log("data",d)
    }
    c();
    

    // Get Contracts
    const masterchefContract = useMasterChefContract()
    const minichefContract = useMiniChefV2Contract()

    // Get Portfolios
    const [portfolio, setPortfolio] = useState<any[]>()
    const masterchefv1Positions = useStakedPending(masterchefContract)
    const minichefPositions = useStakedPending(minichefContract)
    useEffect(() => {
        // determine masterchefv1 positions
        let masterchefv1Portfolio
        if (masterchefv1) {
            const masterchefv1WithPids = masterchefv1Positions?.[0].map((position, index) => {
                return {
                    pid: index,
                    pending_bn: position?.result?.[0],
                    staked_bn: masterchefv1Positions?.[1][index].result?.amount
                }
            })
            const masterchefv1Filtered = masterchefv1WithPids.filter(position => {
                return position?.pending_bn?.gt(0) || position?.staked_bn?.gt(0)
            })
            // fetch any relevant details through pid
            const masterchefv1PositionsWithDetails = masterchefv1Filtered.map(position => {
                const pair = masterchefv1?.find((pair: any) => pair.pid === position.pid)
                return {
                    ...pair,
                    ...position
                }
            })
            masterchefv1Portfolio = masterchefv1PositionsWithDetails
        }

        let minichefPortfolio
        if (minichef) {
            // determine minichef positions
            const minichefWithPids = minichefPositions?.[0].map((position, index) => {
                return {
                    pid: index,
                    pending: position?.result?.[0],
                    staked: minichefPositions?.[1][index].result?.amount
                }
            })
            const minichefFiltered = minichefWithPids.filter((position: any) => {
                return position?.pending?.gt(0) || position?.staked?.gt(0)
            })
            // fetch any relevant details through pid
            const minichefPositionsWithDetails = minichefFiltered.map(position => {
                const pair = minichef?.find((pair: any) => pair.pid === position.pid)
                return {
                    ...pair,
                    ...position
                }
            })
            minichefPortfolio = minichefPositionsWithDetails
        }

        setPortfolio(
            _.concat(minichefPortfolio, masterchefv1Portfolio)[0]
                ? _.concat(minichefPortfolio, masterchefv1Portfolio)
                : []
        )
    }, [masterchefv1, masterchefv1Positions, minichef, minichefPositions])

    // MasterChef v2
    const farms = allFarms

    //Search Setup
    const options = { keys: ['symbol', 'name', 'pairAddress'], threshold: 0.4 }
    const { result, search, term } = useFuse({
        data: farms && farms.length > 0 ? farms : [],
        options
    })
    const flattenSearchResults = result.map((a: { item: any }) => (a.item ? a.item : a))

    // Sorting Setup
    const { items, requestSort, sortConfig } = useSortableData(flattenSearchResults)


    return (
        <>
            <Helmet>
                <title>{i18n._(t`Yield`)} | TabooSwap</title>
                <meta name="description" content="Farm TABOO by staking LP (Liquidity Provider) tokens" />
            </Helmet>
            <div className="container grid grid-cols-4 gap-4 mx-auto">
                <div className="sticky top-0 hidden lg:block md:col-span-1" style={{ maxHeight: '40rem' }}>
                    <Menu section={section} setSection={setSection} />
                </div>
                <div className="col-span-4 lg:col-span-3">
                    <Card
                        className="h-full bg-dark-900"
                        header={
                            <CardHeader className="flex flex-col items-center bg-dark-800">
                                <div className="flex justify-between w-full">
                                    <div className="items-center hidden md:flex">
                                        <div className="mr-2 text-lg whitespace-nowrap">{i18n._(t`Yield Farms`)}</div>
                                    </div>
                                    <Search search={search} term={term} />
                                </div>
                                <div className="container block pt-6 lg:hidden">
                                    <Menu section={section} setSection={setSection} />
                                </div>
                                {chainId === ChainId.MATIC && (
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                                        <div className="flex">
                                            <div className="ml-3">
                                                <p className="text-sm text-yellow-700">
                                                    Polygon subgraphs are currently experiencing high loads. The APY
                                                    displayed are based on lagging fees. Funds are safe, we are working
                                                    on resolving and providing accurate consolidated APY information.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardHeader>
                        }
                    >
                        {section && section === 'portfolio' && (
                            <>
                                {account ? (
                                    <>
                                        <Header sortConfig={sortConfig} requestSort={requestSort} />
                                        <div className="flex-col space-y-2">
                                            {portfolio && portfolio.length > 0 ? (
                                                portfolio.map((farm: any, i: number) => {
                                                    if (farm.type === 'KMP') {
                                                        return <KashiLending key={farm.address + '_' + i} farm={farm} />
                                                    } else if (farm.type === 'SLP') {
                                                        return (
                                                            <LiquidityPosition
                                                                key={farm.address + '_' + i}
                                                                index={farm.address}
                                                                farm={farm}
                                                            />
                                                        )
                                                    } else {
                                                        return null
                                                    }
                                                })
                                            ) : (
                                                <>
                                                    {term ? (
                                                        <div className="w-full py-6 text-center">No Results.</div>
                                                    ) : (
                                                        <div className="w-full py-6 text-center">
                                                            <Dots>Fetching Portfolio</Dots>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full py-6 text-center">Connect Wallet.</div>
                                )}
                            </>
                        )}
                        {section && section === 'all' && (
                            <>
                                <Header sortConfig={sortConfig} requestSort={requestSort} />
                                <div className="flex-col space-y-2">

                                {/* { TEST CODE
                                    liquidityTokensWithBalances.map(list =>{
                                        return(
                                            <li key={list.liquidityToken.decimals}>
                                                {list.liquidityToken.address} {list.tokens[0].symbol}/{list.tokens[1].symbol}
                                            </li>
                                        )
                                        
                                        // return (
                                        //     <LiquidityPosition
                                        //         key={list.liquidityToken.address}
                                        //         farm={list}
                                        //     />
                                        // )
                                    })
                                } */}
                                    
                                    {/* FOLLOWING CODE IS FOR FARM */}
                                    {liquidityTokensWithBalances && liquidityTokensWithBalances.length > 0 ? (
                                        liquidityTokensWithBalances.map((farm, index) => {
                                            return <LiquidityPosition key={index} farm={farm} index={index} />
                                        })
                                    ) : (
                                        <>
                                            {term ? (
                                                <div className="w-full py-6 text-center">No Results.</div>
                                            ) : (
                                                <div className="w-full py-6 text-center">
                                                    <Dots>Fetching Farms</Dots>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                        {section && section === 'slp' && (
                            <>
                                <Header sortConfig={sortConfig} requestSort={requestSort} />
                                <div className="flex-col space-y-2">
                                    {items && items.length > 0 ? (
                                        items.map((farm: any, i: number) => {
                                            if (farm.type === 'SLP') {
                                                return <LiquidityPosition key={farm.address + '_' + i} index={farm.address}  farm={farm} />
                                            } else {
                                                return null
                                            }
                                        })
                                    ) : (
                                        <>
                                            {term ? (
                                                <div className="w-full py-6 text-center">No Results.</div>
                                            ) : (
                                                <div className="w-full py-6 text-center">
                                                    <Dots>Fetching Farms</Dots>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                        {section && section === 'kmp' && (
                            <>
                                <Header sortConfig={sortConfig} requestSort={requestSort} />
                                <div className="flex-col space-y-2">
                                    {items && items.length > 0 ? (
                                        items.map((farm: any, i: number) => {
                                            if (farm.type === 'KMP') {
                                                return <KashiLending key={farm.address + '_' + i} farm={farm} />
                                            } else {
                                                return null
                                            }
                                        })
                                    ) : (
                                        <>
                                            {term ? (
                                                <div className="w-full py-6 text-center">No Results.</div>
                                            ) : (
                                                <div className="w-full py-6 text-center">
                                                    <Dots>Fetching Farms</Dots>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                        {section && section === 'mcv2' && (
                            <>
                                <Header sortConfig={sortConfig} requestSort={requestSort} />
                                <div className="flex-col space-y-2">
                                    {items && items.length > 0 ? (
                                        items.map((farm: any, i: number) => {
                                            if (farm.type === 'SLP' && farm.contract === 'masterchefv2') {
                                                return <LiquidityPosition key={farm.address + '_' + i} index={farm.address} farm={farm} />
                                            } else {
                                                return null
                                            }
                                        })
                                    ) : (
                                        <>
                                            {term ? (
                                                <div className="w-full py-6 text-center">No Results.</div>
                                            ) : (
                                                <div className="w-full py-6 text-center">
                                                    <Dots>Fetching Farms</Dots>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </>
    )
}
