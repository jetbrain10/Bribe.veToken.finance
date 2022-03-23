// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";

interface GaugeController {
    struct VotedSlope {
        uint slope;
        uint power;
        uint end;
    }

    struct Point {
        uint bias;
        uint slope;
    }

    function vote_user_slopes(address, address) external view returns (VotedSlope memory);
    function last_user_vote(address, address) external view returns (uint);
    function points_weight(address, uint256) external view returns (Point memory);
    function checkpoint_gauge(address) external;
}

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
    function balanceOf(address) external view returns (uint);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint amount) external returns (bool);
}

contract Bribe is Ownable {
    uint constant WEEK = 86400 * 7;
    uint constant PRECISION = 10**18;
    uint8 public feePercentage;
    GaugeController GAUGE_CONTROLLER;

    constructor(address _gaugeControllerAddress, uint8 _feePercentage){
        GAUGE_CONTROLLER = GaugeController(_gaugeControllerAddress);
        set_fee_percentage(_feePercentage);
    }

    mapping(address => mapping(address => uint)) public active_period;
    mapping(address => mapping(address => uint)) public reward_per_token;
    mapping(address => mapping(address => mapping(address => uint))) public last_user_claim;

    function _update_period(address gauge, address reward_token) internal returns (uint) {
        uint _period = active_period[gauge][reward_token];
        if (block.timestamp >= _period + WEEK) {
            _period = block.timestamp / WEEK * WEEK;
            GAUGE_CONTROLLER.checkpoint_gauge(gauge);
            uint _slope = GAUGE_CONTROLLER.points_weight(gauge, _period).slope;
            uint _amount = IERC20(reward_token).balanceOf(address(this));
            reward_per_token[gauge][reward_token] = _amount * PRECISION / _slope;
            active_period[gauge][reward_token] = _period;
        }
        return _period;
    }

    function add_reward_amount(address gauge, address reward_token, uint amount) external returns (bool) {
        _safeTransferFrom(reward_token, msg.sender, address(this), amount);
        _update_period(gauge, reward_token);
        return true;
    }

    function claimable(address user, address gauge, address reward_token) external view returns (uint) {
        uint _period = active_period[gauge][reward_token];
        uint _amount = 0;
        if (last_user_claim[user][gauge][reward_token] < _period) {
            uint _last_vote = GAUGE_CONTROLLER.last_user_vote(user, gauge);
            if (_last_vote < _period) {
                uint _slope = GAUGE_CONTROLLER.vote_user_slopes(user, gauge).slope;
                _amount = _slope * reward_per_token[gauge][reward_token] / PRECISION;
                _amount -= calculate_fee(_amount);
            }
        }
        return _amount;
    }

    function claim_reward(address user, address gauge, address reward_token) external returns (uint) {
        return _claim_reward(user, gauge, reward_token);
    }

    function claim_reward(address gauge, address reward_token) external returns (uint) {
        return _claim_reward(msg.sender, gauge, reward_token);
    }

    function _claim_reward(address user, address gauge, address reward_token) internal returns (uint) {
        uint _period = _update_period(gauge, reward_token);
        uint _amount = 0;
        if (last_user_claim[user][gauge][reward_token] < _period) {
            last_user_claim[user][gauge][reward_token] = _period;
            uint _last_vote = GAUGE_CONTROLLER.last_user_vote(user, gauge);
            if (_last_vote < _period) {
                uint _slope = GAUGE_CONTROLLER.vote_user_slopes(user, gauge).slope;
                _amount = _slope * reward_per_token[gauge][reward_token] / PRECISION;
                if (_amount > 0) {
                    _amount -= calculate_fee(_amount);
                    _safeTransfer(reward_token, user, _amount);
                }
            }
        }
        return _amount;
    }

    function _safeTransfer(
        address token,
        address to,
        uint256 value
    ) internal {
        (bool success, bytes memory data) =
        token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))));
    }

    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) internal {
        (bool success, bytes memory data) =
        token.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))));
    }

    function set_fee_percentage(uint8 _feePercentage) public onlyOwner {
        require(_feePercentage <= 15, 'Fee too high');
        feePercentage = _feePercentage;
    }

    function calculate_fee(uint amount) public view returns (uint) {
        return amount * (feePercentage/100);
    }

}
