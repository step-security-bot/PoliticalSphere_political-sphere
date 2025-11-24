'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">political-sphere documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                        <li class="link">
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
                            </a>
                        </li>
                        <li class="link">
                            <a href="contributing.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CONTRIBUTING
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/BillService.html" data-type="entity-link" >BillService</a>
                            </li>
                            <li class="link">
                                <a href="classes/GovernmentService.html" data-type="entity-link" >GovernmentService</a>
                            </li>
                            <li class="link">
                                <a href="classes/GovernmentService-1.html" data-type="entity-link" >GovernmentService</a>
                            </li>
                            <li class="link">
                                <a href="classes/JudiciaryService.html" data-type="entity-link" >JudiciaryService</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParliamentService.html" data-type="entity-link" >ParliamentService</a>
                            </li>
                            <li class="link">
                                <a href="classes/PartyService.html" data-type="entity-link" >PartyService</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserService.html" data-type="entity-link" >UserService</a>
                            </li>
                            <li class="link">
                                <a href="classes/VoteService.html" data-type="entity-link" >VoteService</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/CabinetMeeting.html" data-type="entity-link" >CabinetMeeting</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Campaign.html" data-type="entity-link" >Campaign</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Candidate.html" data-type="entity-link" >Candidate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Chamber.html" data-type="entity-link" >Chamber</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Constituency.html" data-type="entity-link" >Constituency</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateCabinetMeetingData.html" data-type="entity-link" >CreateCabinetMeetingData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateCaseData.html" data-type="entity-link" >CreateCaseData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateExecutiveActionData.html" data-type="entity-link" >CreateExecutiveActionData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateGovernmentData.html" data-type="entity-link" >CreateGovernmentData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateJudgeData.html" data-type="entity-link" >CreateJudgeData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateMinisterData.html" data-type="entity-link" >CreateMinisterData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreatePrecedentData.html" data-type="entity-link" >CreatePrecedentData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateReviewData.html" data-type="entity-link" >CreateReviewData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateRulingData.html" data-type="entity-link" >CreateRulingData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Debate.html" data-type="entity-link" >Debate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Election.html" data-type="entity-link" >Election</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExecutiveAction.html" data-type="entity-link" >ExecutiveAction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Government.html" data-type="entity-link" >Government</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Judge.html" data-type="entity-link" >Judge</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LegalCase.html" data-type="entity-link" >LegalCase</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Minister.html" data-type="entity-link" >Minister</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Motion.html" data-type="entity-link" >Motion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Precedent.html" data-type="entity-link" >Precedent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Review.html" data-type="entity-link" >Review</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Ruling.html" data-type="entity-link" >Ruling</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Speech.html" data-type="entity-link" >Speech</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Vote.html" data-type="entity-link" >Vote</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VoteRecord.html" data-type="entity-link" >VoteRecord</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VoteResults.html" data-type="entity-link" >VoteResults</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});