import {
  useAddress,
  useNetwork,
  useContract,
  ConnectWallet,
  Web3Button,
  useNFTBalance,
} from "@thirdweb-dev/react";
import { ChainId } from "@thirdweb-dev/sdk";
import { useState, useEffect, useMemo } from "react";
import { AddressZero } from "@ethersproject/constants";

const App = () => {
  // Use the hooks thirdweb give us.
  const address = useAddress();
  const network = useNetwork();
  console.log("👋 Address:", address);
  // Initialize our Edition Drop contract
  const editionDropAddress = "0xE35c8346a58DcE8d2fF9471c7609ef43f8bD4eB9";
  const { contract: editionDrop } = useContract(
    editionDropAddress,
    "edition-drop"
  );
  // Initialize our token contract
  const { contract: token } = useContract(
    "0x1681A54319C17F5f54C981679aD10D2D2FFEfF2c",
    "token"
  );
  const { contract: vote } = useContract(
    "0x4278E988025F593B9E3E5d69F45A7b6a8d104b3B",
    "vote"
  );
  // Hook to check if the user has our NFT
  const { data: nftBalance } = useNFTBalance(editionDrop, address, "0");

  const hasClaimedNFT = useMemo(() => {
    return nftBalance && nftBalance.gt(0);
  }, [nftBalance]);

  // Holds the amount of token each member has in state.
  const [memberTokenAmounts, setMemberTokenAmounts] = useState([]);
  // The array holding all of our members addresses.
  const [memberAddresses, setMemberAddresses] = useState([]);

  // A fancy function to shorten someones wallet address, no need to show the whole thing.
  const shortenAddress = (str) => {
    return str.substring(0, 6) + "..." + str.substring(str.length - 4);
  };

  const [proposals, setProposals] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Retrieve all our existing proposals from the contract.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // A simple call to vote.getAll() to grab the proposals.
    const getAllProposals = async () => {
      try {
        const proposals = await vote.getAll();
        setProposals(proposals);
        console.log("🌈 Proposals:", proposals);
      } catch (error) {
        console.log("failed to get proposals", error);
      }
    };
    getAllProposals();
  }, [hasClaimedNFT, vote]);

  // We also need to check if the user already voted.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // If we haven't finished retrieving the proposals from the useEffect above
    // then we can't check if the user voted yet!
    if (!proposals.length) {
      return;
    }

    const checkIfUserHasVoted = async () => {
      try {
        const hasVoted = await vote.hasVoted(proposals[0].proposalId, address);
        setHasVoted(hasVoted);
        if (hasVoted) {
          console.log("🥵 User has already voted");
        } else {
          console.log("🙂 User has not voted yet");
        }
      } catch (error) {
        console.error("Failed to check if wallet has voted", error);
      }
    };
    checkIfUserHasVoted();
  }, [hasClaimedNFT, proposals, address, vote]);

  // This useEffect grabs all the addresses of our members holding our NFT.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // Just like we did in the 7-airdrop-token.js file! Grab the users who hold our NFT
    // with tokenId 0.
    const getAllAddresses = async () => {
      try {
        const memberAddresses =
          await editionDrop?.history.getAllClaimerAddresses(0);
        setMemberAddresses(memberAddresses);
        console.log("🚀 Members addresses", memberAddresses);
      } catch (error) {
        console.error("failed to get member list", error);
      }
    };
    getAllAddresses();
  }, [hasClaimedNFT, editionDrop?.history]);

  // This useEffect grabs the # of token each member holds.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    const getAllBalances = async () => {
      try {
        const amounts = await token?.history.getAllHolderBalances();
        setMemberTokenAmounts(amounts);
        console.log("👜 Amounts", amounts);
      } catch (error) {
        console.error("failed to get member balances", error);
      }
    };
    getAllBalances();
  }, [hasClaimedNFT, token?.history]);

  // Now, we combine the memberAddresses and memberTokenAmounts into a single array
  const memberList = useMemo(() => {
    return memberAddresses.map((address) => {
      // We're checking if we are finding the address in the memberTokenAmounts array.
      // If we are, we'll return the amount of token the user has.
      // Otherwise, return 0.
      const member = memberTokenAmounts?.find(
        ({ holder }) => holder === address
      );

      return {
        address,
        tokenAmount: member?.balance.displayValue || "0",
      };
    });
  }, [memberAddresses, memberTokenAmounts]);

  // This is the case where the user hasn't connected their wallet
  // to your web app. Let them call connectWallet.

  if (address && network?.[0].data.chain.id !== ChainId.Polygon) {
    return (
      <div className="unsupported-network">
        <h2>Please connect to Polygon</h2>
        <p>
          This dapp only works on the Polygon network, please switch networks in
          your connected wallet.
        </p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="landing">
        <div id="container">
          <img
            class="center"
            src="/daologo.png"
            alt="D1"
            width="450px"
            padding
            right="0.5rem"
          />
        </div>
        <h1>DAO ALPHA OMEGA</h1>
        <h2> NFT FILM & MEDIA PRODUCTION PLATFORM</h2>

        <div className="btn-hero">
          <ConnectWallet />
        </div>
      </div>
    );
  }
  // If the user has already claimed their NFT we want to display the interal DAO page to them
  // only DAO members will see this. Render all the members + token amounts.
  if (hasClaimedNFT) {
    return (
      <div className="member-page">
        <h1>DAO Member Page</h1>
        <p>Congratulations on being a member</p>
        <div>
          <div>
            <h2>Member List</h2>
            <table className="card">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Token Amount</th>
                </tr>
              </thead>
              <tbody>
                {memberList.map((member) => {
                  return (
                    <tr key={member.address}>
                      <td>{shortenAddress(member.address)}</td>
                      <td>{member.tokenAmount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div>
            <h2>Active Proposals</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                //before we do async things, we want to disable the button to prevent double clicks
                setIsVoting(true);

                // lets get the votes from the form for the values
                const votes = proposals.map((proposal) => {
                  const voteResult = {
                    proposalId: proposal.proposalId,
                    //abstain by default
                    vote: 2,
                  };
                  proposal.votes.forEach((vote) => {
                    const elem = document.getElementById(
                      proposal.proposalId + "-" + vote.type
                    );

                    if (elem.checked) {
                      voteResult.vote = vote.type;
                      return;
                    }
                  });
                  return voteResult;
                });

                // first we need to make sure the user delegates their token to vote
                try {
                  //we'll check if the wallet still needs to delegate their tokens before they can vote
                  const delegation = await token.getDelegationOf(address);
                  // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
                  if (delegation === AddressZero) {
                    //if they haven't delegated their tokens yet, we'll have them delegate them before voting
                    await token.delegateTo(address);
                  }
                  // then we need to vote on the proposals
                  try {
                    await Promise.all(
                      votes.map(async ({ proposalId, vote: _vote }) => {
                        // before voting we first need to check whether the proposal is open for voting
                        // we first need to get the latest state of the proposal
                        const proposal = await vote.get(proposalId);
                        // then we check if the proposal is open for voting (state === 1 means it is open)
                        if (proposal.state === 1) {
                          // if it is open for voting, we'll vote on it
                          return vote.vote(proposalId, _vote);
                        }
                        // if the proposal is not open for voting we just return nothing, letting us continue
                        return;
                      })
                    );
                    try {
                      // if any of the propsals are ready to be executed we'll need to execute them
                      // a proposal is ready to be executed if it is in state 4
                      await Promise.all(
                        votes.map(async ({ proposalId }) => {
                          // we'll first get the latest state of the proposal again, since we may have just voted before
                          const proposal = await vote.get(proposalId);

                          //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                          if (proposal.state === 4) {
                            return vote.execute(proposalId);
                          }
                        })
                      );
                      // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                      setHasVoted(true);
                      // and log out a success message
                      console.log("successfully voted");
                    } catch (err) {
                      console.error("failed to execute votes", err);
                    }
                  } catch (err) {
                    console.error("failed to vote", err);
                  }
                } catch (err) {
                  console.error("failed to delegate tokens");
                } finally {
                  // in *either* case we need to set the isVoting state to false to enable the button again
                  setIsVoting(false);
                }
              }}
            >
              <div class="freelance-card">
                <div class="freelance-card__header">
                  <h3 class="freelance-card__title">
                    Freelance Smart Contract Jobs
                  </h3>
                </div>
                <div class="freelance-card__body">
                  <p class="freelance-card__text">
                    Looking for a freelance developer to help you with your
                    smart contract needs? Look no further! Our team of expert
                    developers is ready to help you build your next
                    decentralized application.
                  </p>
                </div>
                <div class="freelance-card__footer">
                  <a href="." class="freelance-card__button">
                    Contact Us
                  </a>
                </div>
              </div>

              {proposals.map((proposal) => (
                <div key={proposal.proposalId} className="card">
                  <div class="card-content"></div>
                  <h5>{proposal.description}</h5>
                  <progress
                    value={proposal.voteCount}
                    max={memberAddresses.length}
                  />
                  <div class="proposal-container">
                    <p>
                      {proposal.voteCount} out of {memberAddresses.length}{" "}
                      members have voted
                    </p>

                    <div class="vote-counter">
                      <div class="progress-bar">
                        <div class="Against" style={{ width: 1 }}></div>
                        <div class="For" style={{ width: 1 }}></div>
                        <div class="Abstain" style={{ width: 1 }}></div>
                        <div class="progress" style={{ width: 100 }}></div>
                      </div>

                      <span>% voted in favor</span>
                    </div>
                  </div>

                  <div>
                    {proposal.votes.map(({ type, label }) => (
                      <div key={type}>
                        <input
                          type="radio"
                          id={proposal.proposalId + "-" + type}
                          name={proposal.proposalId}
                          value={type}
                          //default the "abstain" vote to checked
                          defaultChecked={type === 2}
                        />
                        <label htmlFor={proposal.proposalId + "-" + type}>
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button disabled={isVoting || hasVoted} type="submit">
                {isVoting
                  ? "Voting..."
                  : hasVoted
                  ? "You Already Voted"
                  : "Submit Votes"}
              </button>
              {!hasVoted && (
                <small>
                  This will trigger multiple transactions that you will need to
                  sign.
                </small>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  const getAllProposals = async () => {
    console.log(proposals);

    const proposalID = "0";
    const proposalVotes = await proposals.getAll();
    const proposal = proposalVotes.find(
      (vote) => vote.proposalID === proposalID
    );

    return (
      <div>
        <div>Proposal ID: {proposalID}</div>
        <VoteCounter
          Against={proposal.downvotes}
          For={proposal.upvotes}
          Abstain={proposal.anyvotes}
        />
      </div>
    );
  };

  const VoteCounter = ({ upvotes, downvotes, anyvotes }) => {
    const [percentage, setPercentage] = useState(0);
    function updateProgressBar(optionAVotes, optionBVotes, optionCVotes) {
      const totalVotes = optionAVotes + optionBVotes + optionCVotes;
      const optionAPercentage = (optionAVotes / totalVotes) * 100;
      const optionBPercentage = (optionBVotes / totalVotes) * 100;
      const optionCPercentage = (optionCVotes / totalVotes) * 100;

      document.querySelector(".For").style.width = `${optionAPercentage}%`;
      document.querySelector(".Against").style.width = `${optionBPercentage}%`;
      document.querySelector(".Abstain").style.width = `${optionCPercentage}%`;
    }
    let optionAVotes = 0;
    let optionBVotes = 0;
    let optionCVotes = 0;

    const optionAButton = document.querySelector("For");
    optionAButton.addEventListener("click", () => {
      optionAVotes++;
      updateProgressBar(optionAVotes, optionBVotes, optionCVotes);
    });

    const optionBButton = document.querySelector("Against");
    optionBButton.addEventListener("click", () => {
      optionBVotes++;
      updateProgressBar(optionAVotes, optionBVotes, optionCVotes);
    });

    const optionCButton = document.querySelector("Abstain");
    optionCButton.addEventListener("click", () => {
      optionCVotes++;
      updateProgressBar(optionAVotes, optionBVotes, optionCVotes);
    });
    updateProgressBar(optionAVotes, optionBVotes, optionCVotes);

    useEffect(() => {
      let totalVotes = upvotes + downvotes + anyvotes;
      let percentage = (upvotes + downvotes + anyvotes / totalVotes) * 100;

      setPercentage(percentage);
    }, [upvotes, downvotes, anyvotes]);

    return <div>Percentage of Upvotes: {percentage}%</div>;
  };

  getAllProposals();

  // Render mint nft screen.
  return (
    <div className="mint-nft">
      <h1>Mint your free DAO Membership NFT</h1>
      <div className="btn-hero">
        <Web3Button
          contractAddress={editionDropAddress}
          action={(contract) => {
            contract.erc1155.claim(0, 1);
          }}
          onSuccess={() => {
            console.log(
              `🌊 Successfully Minted! Check it out on OpenSea: https://opensea.io/assets/${editionDrop.getAddress()}/0`
            );
          }}
          onError={(error) => {
            console.error("Failed to mint NFT", error);
          }}
        >
          Mint your NFT (FREE)
        </Web3Button>
      </div>
    </div>
  );
};

export default App;

